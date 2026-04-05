#!/bin/bash

# start.sh - обновление локального репозитория git
# Использование: ./start.sh [ветка]
# Если указана ветка, выполняется merge main в эту ветку

set -e  # прерывать выполнение при ошибке

# Проверка, что мы внутри git-репозитория
if ! git rev-parse --is-inside-work-tree > /dev/null 2>&1; then
    echo "Ошибка: текущая директория не является git-репозиторием"
    exit 1
fi

echo "Обновление информации из удалённого репозитория..."
git fetch --all --prune

echo "Переключение на ветку main и её обновление..."
git checkout main
git pull origin main

# Если передан первый аргумент
if [ -n "$1" ]; then
    TARGET_BRANCH="$1"
    echo "Целевая ветка: $TARGET_BRANCH"

    # Проверяем существование ветки локально
    if ! git show-ref --verify --quiet "refs/heads/$TARGET_BRANCH"; then
        echo "Ошибка: ветка '$TARGET_BRANCH' не существует локально"
        exit 1
    fi

    echo "Переключение на ветку $TARGET_BRANCH..."
    git checkout "$TARGET_BRANCH"

    echo "Слияние main в $TARGET_BRANCH..."
    if git merge main; then
        echo "Слияние выполнено успешно."
    else
        echo "ВНИМАНИЕ: возникли конфликты при слиянии. Исправьте их вручную."
        exit 1
    fi
else
    echo "Аргумент не передан – только обновили main."
fi

echo "Готово."