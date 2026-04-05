#!/bin/bash

# end.sh - сохранение изменений на GitHub
# Использование: ./end.sh "сообщение коммита" [ветка-для-слияния]
# Если указана вторая ветка, она будет слита в main перед отправкой

set -e

# Проверка, что мы внутри git-репозитория
if ! git rev-parse --is-inside-work-tree > /dev/null 2>&1; then
    echo "Ошибка: текущая директория не является git-репозиторием"
    exit 1
fi

# Первый аргумент обязателен (сообщение коммита)
if [ -z "$1" ]; then
    echo "Ошибка: не указано сообщение коммита"
    echo "Использование: $0 \"сообщение\" [ветка-для-слияния]"
    exit 1
fi

COMMIT_MSG="$1"
MERGE_BRANCH="$2"

echo "Добавление всех изменений..."
git add -A

echo "Создание коммита с сообщением: $COMMIT_MSG"
git commit -m "$COMMIT_MSG"

# Если передан второй аргумент (ветка для слияния в main)
if [ -n "$MERGE_BRANCH" ]; then
    echo "Запрошено слияние ветки '$MERGE_BRANCH' в main"

    # Проверяем существование указанной ветки
    if ! git show-ref --verify --quiet "refs/heads/$MERGE_BRANCH"; then
        echo "Ошибка: ветка '$MERGE_BRANCH' не существует локально"
        exit 1
    fi

    echo "Переключение на main..."
    git checkout main

    echo "Слияние $MERGE_BRANCH в main..."
    if git merge "$MERGE_BRANCH"; then
        echo "Слияние успешно."
    else
        echo "ВНИМАНИЕ: конфликты при слиянии. Исправьте их вручную."
        exit 1
    fi

    echo "Отправка main на GitHub..."
    git push origin main
else
    # Отправляем текущую ветку на GitHub
    CURRENT_BRANCH=$(git branch --show-current)
    echo "Отправка ветки '$CURRENT_BRANCH' на GitHub..."
    git push origin "$CURRENT_BRANCH"
fi

echo "Готово. Изменения сохранены на GitHub."