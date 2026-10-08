/**
 * Комментарии в коде: каждый файл фронта начинается с шапки-комментария «зачем этот файл».
 *
 * Агент забывает всё между сессиями, и шапка — первое, что следующая сессия читает
 * в файле. Тег AI: на граблях машина не проверит — это правило RULES.md.
 */
import { readdirSync, readFileSync } from 'node:fs'
import { join, relative } from 'node:path'

const SRC_DIR = join(__dirname)

function sourceFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name)
    if (entry.isDirectory()) return sourceFiles(path)
    return /\.(ts|tsx)$/.test(entry.name) ? [path] : []
  })
}

it('у каждого файла в src есть шапка-комментарий', () => {
  const missing = sourceFiles(SRC_DIR)
    .filter((path) => !/^\s*(\/\*\*|\/\/)/.test(readFileSync(path, 'utf-8')))
    .map((path) => relative(SRC_DIR, path))

  expect(missing).toEqual([])
})
