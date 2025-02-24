"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = activate;
exports.deactivate = deactivate;
const vscode = __importStar(require("vscode"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
// Глобальная переменная для хранения найденных переменных
let sassVariables = [];
// Функция для поиска всех SASS/SCSS файлов в папке src
function findSassFiles(dir) {
    let files = [];
    const items = fs.readdirSync(dir, { withFileTypes: true });
    for (const item of items) {
        const fullPath = path.join(dir, item.name);
        if (item.isDirectory()) {
            files = files.concat(findSassFiles(fullPath));
        }
        else if (item.isFile() &&
            (item.name.endsWith('.sass') || item.name.endsWith('.scss'))) {
            files.push(fullPath);
        }
    }
    return files;
}
// Функция для извлечения переменных из SASS/SCSS файла
function extractVariables(filePath) {
    const content = fs.readFileSync(filePath, 'utf-8');
    const variables = [];
    const variableRegex = /\$([a-zA-Z0-9_-]+)/g;
    let match;
    while ((match = variableRegex.exec(content)) !== null) {
        variables.push(match[1]);
    }
    return variables;
}
// Функция для обновления списка переменных
function updateSassVariables() {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders) {
        return;
    }
    sassVariables = [];
    for (const folder of workspaceFolders) {
        const sassFiles = findSassFiles(path.join(folder.uri.fsPath, 'src'));
        for (const file of sassFiles) {
            const variables = extractVariables(file);
            sassVariables = sassVariables.concat(variables);
        }
    }
    // Убираем дубликаты
    sassVariables = [...new Set(sassVariables)];
}
// Активация плагина
function activate(context) {
    // Обновляем переменные при активации плагина
    updateSassVariables();
    // Регистрируем команду для обновления переменных вручную
    const updateCommand = vscode.commands.registerCommand('sass-variables-prompter.update', () => {
        updateSassVariables();
        vscode.window.showInformationMessage('SASS variables updated!');
    });
    // Регистрируем провайдер автодополнения
    const completionProvider = vscode.languages.registerCompletionItemProvider(['scss', 'sass'], {
        provideCompletionItems(document, position) {
            const linePrefix = document
                .lineAt(position)
                .text.slice(0, position.character);
            if (!linePrefix.endsWith('$')) {
                return undefined;
            }
            return sassVariables.map(variable => new vscode.CompletionItem(`$${variable}`, vscode.CompletionItemKind.Variable));
        },
    });
    // Добавляем команду и провайдер в контекст
    context.subscriptions.push(updateCommand, completionProvider);
}
// Деактивация плагина
function deactivate() { }
//# sourceMappingURL=extension.js.map