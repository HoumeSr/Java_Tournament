#!/bin/bash
git fetch origin
git checkout $1
git merge origin/main --no-edit