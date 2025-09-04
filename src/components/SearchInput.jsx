// src/components/SearchInput.jsx
export default function SearchInput({ value, onChange, placeholder = "Rechercher..." }) {
  return (
    <div className="w-full rounded-xl bg-background-soft border border-borderc px-3 py-2 flex items-center gap-2">
      <span className="text-sm text-textc-muted">🔎</span>
      <input
        type="search"
        inputMode="search"
        enterKeyHint="search"
        autoComplete="off"
        autoCorrect="off"
        spellCheck={false}
        className="w-full bg-transparent outline-none text-base sm:text-sm" // <= 16px sur mobile, 14px dès sm
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        placeholder={placeholder}
      />
    </div>
  );
}
