export function SearchForm({ query, category }: { query?: string; category?: string }) {
  return (
    <form action="/marketplace" className="flex max-w-xl gap-2">
      <label className="sr-only" htmlFor="marketplace-search">
        Tìm sản phẩm
      </label>
      <input
        id="marketplace-search"
        name="q"
        maxLength={120}
        defaultValue={query}
        placeholder="Tìm giáo trình, đồng phục, máy tính…"
        className="input min-w-0 flex-1"
      />
      {category && <input type="hidden" name="category" value={category} />}
      <button className="button" type="submit">
        Tìm kiếm
      </button>
    </form>
  );
}
