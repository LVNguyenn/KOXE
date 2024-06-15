const sort = ({ data, sort }: { data: any[]; sort?: string }) => {
  if (!sort) {
    return [...data];
  }

  const sortOptions = sort.split(",").map((field: any) => {
    const [key, order] = field.trim().startsWith("-")
      ? [field.trim().substring(1), "DESC"]
      : [field.trim(), "ASC"];
    return { key, order };
  });

  return [...data].sort((a, b) => {
    for (const { key, order } of sortOptions) {
      const comparison = order === "ASC" ? 1 : -1;
      const valueA = typeof a[key] === "string" ? a[key].toLowerCase() : a[key];
      const valueB = typeof b[key] === "string" ? b[key].toLowerCase() : b[key];
      if (valueA !== valueB) {
        return (valueA < valueB ? -1 : 1) * comparison;
      }
    }
    return 0;
  });
};

export default sort;
