"""Command line interface for Keys Indexer."""

import argparse
import logging
import sys
from pathlib import Path

from .indexer import KeysIndexer
from .models import ArtifactType
from .repro_generator import ReproPackGenerator
from .validator import ArtifactValidator


def setup_logging(verbose: bool = False):
    """Setup logging configuration."""
    level = logging.DEBUG if verbose else logging.INFO
    logging.basicConfig(
        level=level,
        format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    )


def main():
    """Main CLI entry point."""
    parser = argparse.ArgumentParser(
        description="Keys Knowledge Indexer - Index and validate knowledge artifacts",
        prog="keys-indexer",
    )
    
    parser.add_argument(
        "--repo-root",
        type=Path,
        default=Path.cwd(),
        help="Root directory of the repository to index (default: current directory)",
    )
    
    parser.add_argument(
        "--output-dir",
        type=Path,
        help="Directory to write output files (default: <repo-root>/outputs/keys_index)",
    )
    
    parser.add_argument(
        "--index",
        action="store_true",
        help="Index all knowledge artifacts",
    )
    
    parser.add_argument(
        "--validate",
        action="store_true",
        help="Validate artifacts after indexing",
    )
    
    parser.add_argument(
        "--validate-only",
        action="store_true",
        help="Only validate existing index (don't re-index)",
    )
    
    parser.add_argument(
        "--dry-run",
        action="store_true",
        default=True,
        help="Dry-run validation (don't actually execute code)",
    )
    
    parser.add_argument(
        "--no-dry-run",
        action="store_false",
        dest="dry_run",
        help="Actually execute code during validation (USE WITH CAUTION)",
    )
    
    parser.add_argument(
        "--query",
        type=str,
        help="Query artifacts by type (notebook, runbook, script, template)",
    )
    
    parser.add_argument(
        "--runnable-only",
        action="store_true",
        help="Only show runnable artifacts (used with --query)",
    )
    
    parser.add_argument(
        "--generate-repro",
        action="store_true",
        help="Generate reproduction packs for runnable artifacts",
    )
    
    parser.add_argument(
        "--repro-dir",
        type=Path,
        help="Directory for reproduction packs (default: <repo-root>/outputs/repro_packs)",
    )
    
    parser.add_argument(
        "--verbose",
        action="store_true",
        help="Enable verbose logging",
    )
    
    parser.add_argument(
        "--version",
        action="version",
        version="%(prog)s 0.1.0",
    )
    
    args = parser.parse_args()
    setup_logging(args.verbose)
    
    indexer = KeysIndexer(
        repo_root=args.repo_root,
        output_dir=args.output_dir,
    )
    
    if args.validate_only:
        # Load existing index and validate
        artifacts = indexer.load_index()
        if not artifacts:
            print("Error: No index found. Run with --index first.")
            return 1
        
        print(f"Validating {len(artifacts)} artifacts...")
        validator = ArtifactValidator(
            repo_root=args.repo_root,
            dry_run=args.dry_run,
        )
        results = validator.validate_all(artifacts)
        
        # Save updated index with validation status
        indexer.save_index()
        
        # Save validation report
        report_path = validator.save_report()
        
        # Print summary
        runnable = sum(1 for r in results.values() if r.status.value == "runnable")
        partial = sum(1 for r in results.values() if r.status.value == "partially_runnable")
        broken = sum(1 for r in results.values() if r.status.value == "broken")
        
        print(f"\nValidation Results:")
        print(f"  Runnable: {runnable}")
        print(f"  Partial: {partial}")
        print(f"  Broken: {broken}")
        print(f"\nReport saved to: {report_path}")
        
        return 0
    
    if args.index or (not args.query and not args.validate_only):
        # Default action: index everything
        artifacts = indexer.index(validate=args.validate)
        output_path = indexer.save_index()
        print(f"Indexed {len(artifacts)} artifacts")
        print(f"Index saved to: {output_path}")
        
        if args.validate:
            results = indexer.validate()
            print(f"\nValidation Results:")
            print(f"  Runnable: {results['runnable']}")
            print(f"  Partial: {results['partial']}")
            print(f"  Broken: {results['broken']}")
            if results["issues"]:
                print(f"\n  Issues found: {len(results['issues'])}")
        
        if args.generate_repro:
            print("\nGenerating reproduction packs...")
            generator = ReproPackGenerator(
                repo_root=args.repo_root,
                output_dir=args.repro_dir,
            )
            packs = generator.generate_all(indexer.artifacts, runnable_only=True)
            print(f"Generated {len(packs)} reproduction packs")
            for artifact_id, pack_path in packs.items():
                print(f"  {artifact_id}: {pack_path}")
    
    if args.query:
        # Load existing index and query
        indexer.load_index()
        artifact_type = ArtifactType(args.query) if args.query else None
        results = indexer.query(
            artifact_type=artifact_type,
            runnable_only=args.runnable_only,
        )
        print(f"\nQuery Results ({len(results)} artifacts):")
        for artifact in results:
            status = artifact.runnable_status.value
            print(f"  [{status}] {artifact.id}: {artifact.title}")
    
    return 0


if __name__ == "__main__":
    sys.exit(main())
