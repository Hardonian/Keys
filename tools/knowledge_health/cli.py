"""Command-line interface for Knowledge Health Monitor.

Usage:
    python -m tools.knowledge_health.cli [options]

Commands:
    check           Run health check on all artifacts
    drift           Detect knowledge drift
    revalidate      Run revalidation for due artifacts
    curate          Generate curation recommendations
    report          Generate health report (JSON and Markdown)
    demo            Run demonstration of decay detection
"""

import argparse
import json
import sys
from pathlib import Path
from typing import Any

from .health_monitor import HealthMonitor
from .drift_detector import DriftDetector
from .revalidation_scheduler import RevalidationScheduler
from .curation_engine import CurationEngine
from .models import SystemHealthConfig, KnowledgeHealthReport


def run_health_check(args: argparse.Namespace) -> int:
    """Run health check command."""
    print("[SCAN] Running health check on all artifacts...")
    
    config = SystemHealthConfig()
    monitor = HealthMonitor(args.repo_root, config)
    
    health_metrics = monitor.check_all_health()
    
    if not health_metrics:
        print("[!] No artifacts found. Run indexer first:")
        print("   python -m tools.keys_indexer.cli --index --validate")
        return 1
    
    # Print summary
    summary = monitor.get_health_summary(health_metrics)
    
    print(f"\n[RESULTS] Health Check Results:")
    print(f"   Total Artifacts: {summary['total']}")
    print(f"   Average Health Score: {summary['average_score']:.1f}/100")
    print(f"\n   Status Distribution:")
    print(f"      [OK] Healthy:   {summary['healthy']} ({summary['healthy']/max(summary['total'],1)*100:.1f}%)")
    print(f"      [WARN] Degraded:  {summary['degraded']} ({summary['degraded']/max(summary['total'],1)*100:.1f}%)")
    print(f"      [CRIT] Critical:  {summary['critical']} ({summary['critical']/max(summary['total'],1)*100:.1f}%)")
    print(f"      [DEAD] Decayed:   {summary['decayed']} ({summary['decayed']/max(summary['total'],1)*100:.1f}%)")
    
    # Show critical artifacts
    critical = [(aid, m) for aid, m in health_metrics.items() if m.status.value in ['critical', 'decayed']]
    if critical:
        print(f"\n   Critical Artifacts (score < 50):")
        for aid, metrics in sorted(critical, key=lambda x: x[1].health_score)[:10]:
            print(f"      • {aid[:50]}... (Score: {metrics.health_score:.0f})")
    
    # Save results
    output_dir = Path(args.output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)
    
    health_data = {aid: m.to_dict() for aid, m in health_metrics.items()}
    health_file = output_dir / "health_metrics.json"
    
    with open(health_file, "w", encoding="utf-8") as f:
        json.dump(health_data, f, indent=2)
    
    print(f"\n[SAVED] Health metrics saved to: {health_file}")
    
    return 0


def run_drift_detection(args: argparse.Namespace) -> int:
    """Run drift detection command."""
    print("[SCAN] Detecting knowledge drift...")
    
    config = SystemHealthConfig()
    monitor = HealthMonitor(args.repo_root, config)
    detector = DriftDetector(args.repo_root, config)
    
    # Check health first
    health_metrics = monitor.check_all_health()
    
    if not health_metrics:
        print("[!] No artifacts found. Run indexer first.")
        return 1
    
    # Detect drift
    alerts = detector.detect_all_drift(health_metrics)
    
    # Categorize
    critical = [a for a in alerts if a.severity == "critical"]
    warnings = [a for a in alerts if a.severity == "warning"]
    info = [a for a in alerts if a.severity == "info"]
    
    print(f"\n[RESULTS] Drift Detection Results:")
    print(f"   Total Alerts: {len(alerts)}")
    print(f"      [CRIT] Critical: {len(critical)}")
    print(f"      [WARN] Warnings: {len(warnings)}")
    print(f"      [INFO] Info: {len(info)}")
    
    if alerts:
        print(f"\n   Top Alerts by Severity:")
        for alert in alerts[:15]:
            icon = "[CRIT]" if alert.severity == "critical" else "[WARN]" if alert.severity == "warning" else "[INFO]"
            print(f"      {icon} [{alert.drift_type.value}] {alert.artifact_id[:45]}...")
            print(f"          `- {alert.message[:60]}...")
    
    # Save results
    output_dir = Path(args.output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)
    
    alerts_file = output_dir / "drift_alerts.json"
    with open(alerts_file, "w", encoding="utf-8") as f:
        json.dump([a.to_dict() for a in alerts], f, indent=2)
    
    print(f"\n[SAVED] Drift alerts saved to: {alerts_file}")
    
    return len(critical)  # Return count of critical issues


def run_revalidation(args: argparse.Namespace) -> int:
    """Run revalidation command."""
    print("[EXEC] Running revalidation...")
    
    config = SystemHealthConfig()
    scheduler = RevalidationScheduler(args.repo_root, config)
    
    if args.artifact:
        # Revalidate specific artifact
        print(f"   Revalidating: {args.artifact}")
        result = scheduler.run_revalidation(args.artifact, dry_run=args.dry_run)
        
        print(f"\n   Result: {'[PASS] Success' if result['success'] else '[FAIL] Failed'}")
        print(f"   Health Score: {result.get('health_score', 'N/A')}")
        print(f"   Health Status: {result.get('health_status', 'N/A')}")
        
        if not result['success'] and 'error' in result:
            print(f"   Error: {result['error']}")
    else:
        # Revalidate all due artifacts
        print("   Checking for artifacts due for revalidation...")
        results = scheduler.run_all_due(dry_run=args.dry_run)
        
        print(f"\n📊 Revalidation Results:")
        print(f"   Artifacts Due: {results['total_due']}")
        print(f"   Processed: {results['processed']}")
        print(f"   Successful: {results['successful']}")
        print(f"   Failed: {results['failed']}")
        
        if args.verbose and results['details']:
            print(f"\n   Details:")
            for detail in results['details']:
                status = "✅" if detail['success'] else "❌"
                print(f"      {status} {detail['artifact_id'][:50]}...")
    
    return 0


def run_curation(args: argparse.Namespace) -> int:
    """Run curation command."""
    print("[CURATE] Generating curation recommendations...")
    
    config = SystemHealthConfig()
    monitor = HealthMonitor(args.repo_root, config)
    detector = DriftDetector(args.repo_root, config)
    engine = CurationEngine(args.repo_root, config)
    
    # Get health metrics and alerts
    health_metrics = monitor.check_all_health()
    alerts = detector.detect_all_drift(health_metrics)
    recommendations = engine.generate_recommendations(health_metrics, alerts)
    
    # Categorize
    by_action: dict[str, list] = {}
    for rec in recommendations:
        action = rec.action.value
        if action not in by_action:
            by_action[action] = []
        by_action[action].append(rec)
    
    print(f"\n[RESULTS] Curation Recommendations:")
    print(f"   Total: {len(recommendations)}")
    
    for action, recs in sorted(by_action.items()):
        print(f"\n   {action.upper().replace('_', ' ')}: {len(recs)}")
        for rec in recs[:5]:
            print(f"      • {rec.artifact_id[:45]}...")
            print(f"        └─ {rec.reason[:50]}...")
    
    # Save results
    output_dir = Path(args.output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)
    
    recs_file = output_dir / "curation_recommendations.json"
    with open(recs_file, "w", encoding="utf-8") as f:
        json.dump([r.to_dict() for r in recommendations], f, indent=2)
    
    print(f"\n[SAVED] Recommendations saved to: {recs_file}")
    
    return 0


def run_report(args: argparse.Namespace) -> int:
    """Generate comprehensive health report."""
    print("[REPORT] Generating knowledge health report...")
    
    config = SystemHealthConfig()
    scheduler = RevalidationScheduler(args.repo_root, config)
    
    json_path, md_path = scheduler.generate_health_reports(Path(args.output_dir))
    
    print(f"\n[DONE] Reports generated:")
    print(f"   JSON: {json_path}")
    print(f"   Markdown: {md_path}")
    
    # Show summary from JSON
    with open(json_path, "r", encoding="utf-8") as f:
        report_data = json.load(f)
    
    print(f"\n[SUMMARY] Report Summary:")
    print(f"   Total Artifacts: {report_data['total_artifacts']}")
    print(f"   Average Health Score: {report_data['average_health_score']:.1f}/100")
    print(f"   Health Trend: {report_data['health_score_trend'].title()}")
    print(f"   Active Alerts: {len(report_data['active_alerts'])}")
    print(f"   Curation Recommendations: {len(report_data['curation_recommendations'])}")
    
    return 0


def run_demo(args: argparse.Namespace) -> int:
    """Run demonstration of decay detection and curation."""
    print("=" * 70)
    print("KNOWLEDGE HEALTH SYSTEM - VERIFICATION DEMO")
    print("=" * 70)
    print()
    
    # Step 1: Show decay detection
    print("PHASE 1: DECAY DETECTION")
    print("-" * 40)
    
    config = SystemHealthConfig()
    monitor = HealthMonitor(args.repo_root, config)
    health_metrics = monitor.check_all_health()
    
    if not health_metrics:
        print("[!] No artifacts found. Creating synthetic demo data...")
        # Create synthetic decay demonstration
        from .models import (
            HealthMetrics, HealthStatus, DependencyHealth, DependencyStatus,
            EnvironmentHealth, EnvironmentStatus, RelevanceHealth, RelevanceStatus,
            ExecutionHistory
        )
        from datetime import datetime, timedelta
        
        # Simulate a decaying artifact
        decayed = HealthMetrics(
            artifact_id="demo_decaying_artifact",
            health_score=25.0,
            status=HealthStatus.CRITICAL,
            dependency_health=DependencyHealth(
                status=DependencyStatus.STALE,
                total_deps=5,
                stale_deps=3,
                issues=["pandas 1.0.0 is outdated", "numpy 1.18.0 has security issues"],
                last_checked=datetime.now(),
            ),
            environment_health=EnvironmentHealth(
                status=EnvironmentStatus.DRIFTED,
                python_version="3.8.0",
                detected_python="3.11.0",
                runtime_mismatch=True,
                issues=["Python version mismatch"],
                last_checked=datetime.now(),
            ),
            relevance_health=RelevanceHealth(
                status=RelevanceStatus.STALE,
                days_since_update=200,
                days_since_verification=150,
                issues=["Content outdated"],
                last_assessed=datetime.now(),
            ),
            execution_history=ExecutionHistory(
                total_attempts=10,
                successful_runs=3,
                failed_runs=7,
                last_failure=datetime.now() - timedelta(days=5),
                last_error_message="ModuleNotFoundError: No module named 'deprecated_pkg'",
            ),
            last_health_check=datetime.now(),
        )
        
        print(f"\n[DECAY] Simulated Decaying Artifact:")
        print(f"   ID: {decayed.artifact_id}")
        print(f"   Health Score: {decayed.health_score}/100 (CRITICAL)")
        print(f"   Dependencies: {decayed.dependency_health.stale_deps}/{decayed.dependency_health.total_deps} stale")
        print(f"   Environment: {decayed.environment_health.status.value}")
        print(f"   Relevance: {decayed.relevance_health.status.value} ({decayed.relevance_health.days_since_update} days old)")
        print(f"   Execution: {decayed.execution_history.failed_runs}/{decayed.execution_history.total_attempts} failures")
        print()
        print("   🔴 DECAY INDICATORS DETECTED:")
        for issue in decayed.dependency_health.issues:
            print(f"      • Dependency: {issue}")
        for issue in decayed.environment_health.issues:
            print(f"      • Environment: {issue}")
        for issue in decayed.relevance_health.issues:
            print(f"      • Relevance: {issue}")
    else:
        # Use real data
        decaying = [(aid, m) for aid, m in health_metrics.items() if m.health_score < 50]
        
        if decaying:
            print(f"\n[DECAY] Found {len(decaying)} decaying artifacts:")
            for aid, metrics in sorted(decaying, key=lambda x: x[1].health_score)[:5]:
                print(f"\n   Artifact: {aid[:50]}...")
                print(f"   Score: {metrics.health_score:.0f}/100 ({metrics.status.value.upper()})")
                if metrics.dependency_health.issues:
                    print(f"   Dependency Issues: {len(metrics.dependency_health.issues)}")
                if metrics.environment_health.issues:
                    print(f"   Environment Issues: {len(metrics.environment_health.issues)}")
                if metrics.execution_history.failed_runs > 0:
                    print(f"   Recent Failures: {metrics.execution_history.failed_runs}")
        else:
            print("\n[OK] No decaying artifacts found! All artifacts are healthy.")
    
    print()
    print("PHASE 2: REVALIDATION ATTEMPT")
    print("-" * 40)
    
    if not health_metrics:
        print("   (Simulating revalidation attempt on decayed artifact)")
        print("   [!] Revalidation would fail due to:")
        print("      • Missing dependency 'deprecated_pkg'")
        print("      • Python version incompatibility")
        print("      • Outdated API calls")
        print("   [ACTION] Recommended: REFACTOR (large effort)")
    else:
        print("   Running revalidation on due artifacts...")
        scheduler = RevalidationScheduler(args.repo_root, config)
        results = scheduler.run_all_due(dry_run=True)
        
        print(f"   ✅ Revalidation complete: {results['successful']}/{results['processed']} passed")
    
    print()
    print("PHASE 3: CURATION OUTPUT")
    print("-" * 40)
    
    if not health_metrics:
        # Synthetic curation output
        print("\n   🎯 Curation Recommendations for Decaying Artifacts:")
        print()
        print("   1. ARCHIVE (High Priority)")
        print("      • demo_old_unused_artifact")
        print("        └─ Unused for 400+ days, consider archival")
        print()
        print("   2. REFACTOR (High Priority)")
        print("      • demo_decaying_artifact")
        print("        └─ Critical dependency failures, needs major rework")
        print()
        print("   3. UPDATE (Medium Priority)")
        print("      • demo_stale_notebook")
        print("        └─ Dependencies outdated, refresh recommended")
        print()
        print("   4. PROMOTE_GOLD (Low Priority)")
        print("      • demo_high_quality_pattern")
        print("        └─ Excellent health metrics, candidate for gold standard")
    else:
        # Real curation
        detector = DriftDetector(args.repo_root, config)
        engine = CurationEngine(args.repo_root, config)
        
        alerts = detector.detect_all_drift(health_metrics)
        recommendations = engine.generate_recommendations(health_metrics, alerts)
        
        by_action: dict[str, list] = {}
        for rec in recommendations:
            action = rec.action.value
            if action not in by_action:
                by_action[action] = []
            by_action[action].append(rec)
        
        print(f"\n   🎯 Generated {len(recommendations)} recommendations:")
        for action, recs in sorted(by_action.items())[:4]:
            print(f"\n   {action.upper().replace('_', ' ')} ({len(recs)}):")
            for rec in recs[:3]:
                print(f"      • {rec.artifact_id[:45]}...")
                print(f"          `- {rec.reason[:55]}...")
    
    print()
    print("=" * 70)
    print("✅ DEMO COMPLETE")
    print("=" * 70)
    print()
    print("Next steps:")
    print("   1. Run full health check: python -m tools.knowledge_health.cli check")
    print("   2. Detect drift: python -m tools.knowledge_health.cli drift")
    print("   3. Generate report: python -m tools.knowledge_health.cli report")
    print()
    
    return 0


def main() -> int:
    """Main CLI entry point."""
    parser = argparse.ArgumentParser(
        description="Knowledge Health Monitor - Track, validate, and curate knowledge artifacts",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Run health check
  python -m tools.knowledge_health.cli check
  
  # Detect drift
  python -m tools.knowledge_health.cli drift
  
  # Generate reports
  python -m tools.knowledge_health.cli report
  
  # Run demonstration
  python -m tools.knowledge_health.cli demo
  
  # Revalidate specific artifact
  python -m tools.knowledge_health.cli revalidate --artifact <id>
        """
    )
    
    parser.add_argument(
        "--repo-root",
        type=Path,
        default=Path("."),
        help="Repository root directory (default: current directory)",
    )
    parser.add_argument(
        "--output-dir",
        type=Path,
        default=Path("outputs/knowledge_health"),
        help="Output directory for reports (default: outputs/knowledge_health)",
    )
    parser.add_argument(
        "-v", "--verbose",
        action="store_true",
        help="Enable verbose output",
    )
    
    subparsers = parser.add_subparsers(dest="command", help="Commands")
    
    # Check command
    check_parser = subparsers.add_parser("check", help="Run health check on all artifacts")
    
    # Drift command
    drift_parser = subparsers.add_parser("drift", help="Detect knowledge drift")
    
    # Revalidate command
    reval_parser = subparsers.add_parser("revalidate", help="Run revalidation")
    reval_parser.add_argument("--artifact", help="Specific artifact ID to revalidate")
    reval_parser.add_argument("--dry-run", action="store_true", default=True, help="Dry run mode (default)")
    reval_parser.add_argument("--no-dry-run", dest="dry_run", action="store_false", help="Actually execute code")
    
    # Curate command
    curate_parser = subparsers.add_parser("curate", help="Generate curation recommendations")
    
    # Report command
    report_parser = subparsers.add_parser("report", help="Generate comprehensive health report")
    
    # Demo command
    demo_parser = subparsers.add_parser("demo", help="Run demonstration of decay detection")
    
    args = parser.parse_args()
    
    if not args.command:
        parser.print_help()
        return 1
    
    # Dispatch to command handler
    commands = {
        "check": run_health_check,
        "drift": run_drift_detection,
        "revalidate": run_revalidation,
        "curate": run_curation,
        "report": run_report,
        "demo": run_demo,
    }
    
    handler = commands.get(args.command)
    if handler:
        return handler(args)
    else:
        parser.print_help()
        return 1


if __name__ == "__main__":
    sys.exit(main())
