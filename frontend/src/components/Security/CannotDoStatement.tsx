'use client';

export function CannotDoStatement() {
  return (
    <div className="bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-700 px-4 py-6" role="contentinfo" aria-label="Limitations">
      <div className="max-w-4xl mx-auto">
        <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
          What This Tool Cannot Do
        </h3>
        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-slate-600 dark:text-slate-400">
          <li className="flex items-start gap-2">
            <span className="text-red-500 mt-0.5" aria-hidden="true">✗</span>
            <span>Write code files or modify your codebase</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-red-500 mt-0.5" aria-hidden="true">✗</span>
            <span>Access or modify your repositories</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-red-500 mt-0.5" aria-hidden="true">✗</span>
            <span>Execute commands or scripts</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-red-500 mt-0.5" aria-hidden="true">✗</span>
            <span>Access your file system or local files</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-red-500 mt-0.5" aria-hidden="true">✗</span>
            <span>Make external API calls (except LLM providers)</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-red-500 mt-0.5" aria-hidden="true">✗</span>
            <span>Share your data with third parties (except LLM APIs)</span>
          </li>
        </ul>
        <p className="mt-4 text-xs text-slate-500 dark:text-slate-500">
          This tool only reads your profile (role, stack) and chat history, and sends your input to LLM providers (OpenAI/Anthropic) to generate outputs.
        </p>
      </div>
    </div>
  );
}
