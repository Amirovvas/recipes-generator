// Разделяем «Название — количество», чтобы выровнять количество по правому краю
export const splitIngredient = (ing: string): [string, string] => {
  const idx = ing.indexOf(' — ')
  return idx === -1 ? [ing, ''] : [ing.slice(0, idx), ing.slice(idx + 3)]
}

const plural = (n: number, one: string, few: string, many: string) => {
  const mod10 = n % 10
  const mod100 = n % 100
  if (mod10 === 1 && mod100 !== 11) return one
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return few
  return many
}

export const pluralServings = (n: number) => plural(n, 'порция', 'порции', 'порций')
export const pluralRecipes = (n: number) => plural(n, 'рецепт', 'рецепта', 'рецептов')
