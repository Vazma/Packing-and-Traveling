export default function CollapsibleSection({
  title,
  description,
  badge,
  collapsed,
  onToggle,
  compact = false,
  children
}) {
  return (
    <div className={compact ? 'border-t border-gray-100' : 'border border-gray-200 rounded-lg overflow-hidden'}>
      <button
        type="button"
        onClick={onToggle}
        className={`w-full flex items-center justify-between text-left transition-colors ${
          compact
            ? 'px-4 py-2 bg-white hover:bg-gray-50'
            : 'px-4 py-3 bg-slate-50 hover:bg-slate-100'
        }`}
      >
        <div>
          <h3 className={compact ? 'text-sm font-medium text-gray-800' : 'font-medium text-gray-900'}>
            {title}
          </h3>
          {description && <p className="text-xs text-gray-500">{description}</p>}
        </div>
        <div className="flex items-center space-x-3">
          {badge && (
            <span className="text-xs text-gray-600 bg-white border border-gray-200 px-2 py-1 rounded-full">
              {badge}
            </span>
          )}
          <svg
            className={`w-5 h-5 text-gray-500 transition-transform ${collapsed ? '' : 'rotate-180'}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {!collapsed && children}
    </div>
  )
}
