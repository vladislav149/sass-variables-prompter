import * as vscode from 'vscode'
import * as fs from 'fs'
import * as path from 'path'

// Глобальная переменная для хранения найденных переменных
let sassVariables: string[] = []

// Функция для поиска всех SASS/SCSS файлов в папке src
function findSassFiles(dir: string): string[] {
  let files: string[] = []
  const items = fs.readdirSync(dir, {withFileTypes: true})

  for (const item of items) {
    const fullPath = path.join(dir, item.name)
    if (item.isDirectory()) {
      files = files.concat(findSassFiles(fullPath))
    } else if (
      item.isFile() &&
      (item.name.endsWith('.sass') || item.name.endsWith('.scss'))
    ) {
      files.push(fullPath)
    }
  }

  return files
}

// Функция для извлечения переменных из SASS/SCSS файла
function extractVariables(filePath: string): string[] {
  const content = fs.readFileSync(filePath, 'utf-8')
  const variables: string[] = []
  const variableRegex = /\$([a-zA-Z0-9_-]+)/g

  let match
  while ((match = variableRegex.exec(content)) !== null) {
    variables.push(match[1])
  }

  return variables
}

// Функция для обновления списка переменных
function updateSassVariables() {
  const workspaceFolders = vscode.workspace.workspaceFolders
  if (!workspaceFolders) {
    return
  }

  sassVariables = []
  for (const folder of workspaceFolders) {
    const sassFiles = findSassFiles(path.join(folder.uri.fsPath, 'src'))
    for (const file of sassFiles) {
      const variables = extractVariables(file)
      sassVariables = sassVariables.concat(variables)
    }
  }

  // Убираем дубликаты
  sassVariables = [...new Set(sassVariables)]
}

// Активация плагина
export function activate(context: vscode.ExtensionContext) {
  // Обновляем переменные при активации плагина
  updateSassVariables()

  // Регистрируем команду для обновления переменных вручную
  const updateCommand = vscode.commands.registerCommand(
    'sass-variables-prompter.update',
    () => {
      updateSassVariables()
      vscode.window.showInformationMessage('SASS variables updated!')
    }
  )

  // Регистрируем провайдер автодополнения
  const completionProvider = vscode.languages.registerCompletionItemProvider(
    ['scss', 'sass'],
    {
      provideCompletionItems(
        document: vscode.TextDocument,
        position: vscode.Position
      ) {
        const linePrefix = document
          .lineAt(position)
          .text.slice(0, position.character)
        if (!linePrefix.endsWith('$')) {
          return undefined
        }

        return sassVariables.map(
          variable =>
            new vscode.CompletionItem(
              `$${variable}`,
              vscode.CompletionItemKind.Variable
            )
        )
      },
    }
  )

  // Добавляем команду и провайдер в контекст
  context.subscriptions.push(updateCommand, completionProvider)
}

// Деактивация плагина
export function deactivate() {}
