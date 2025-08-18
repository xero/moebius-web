#!/bin/bash

git rm -r css/ fonts/ img/ js/ index.html
git checkout main public
mv public/* .
rm -rf public
git add .
git commit -S -m 'chore(demo): sync'
