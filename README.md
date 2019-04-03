# Storyscript extension for the Atom editor

[![CircleCI](https://img.shields.io/circleci/project/github/storyscript/atom/master.svg?style=for-the-badge)](https://circleci.com/gh/storyscript/atom)

Provides Storyscript language support for Atom powered by the [Storyscript Language Server](https://github.com/storyscript/sls).

## Installation

Launch Atom Quick Open (Ctrl+P) and go to "Settings View: Install Packages and Themes":

![quick open install packages](https://user-images.githubusercontent.com/4370550/55517851-1d56d080-5672-11e9-857d-6119949d2fe7.png)

Now search for `ide-storyscript` and hit "Install":

![install ide-storyscript](https://user-images.githubusercontent.com/4370550/55517906-4d05d880-5672-11e9-9646-86741e4d4f20.png)

Alternatively, you can also install `ide-storyscript` via the Atom Package Manager (APM):

```shell
apm install ide-storyscript
```

## Features

![feature overview](https://user-images.githubusercontent.com/4370550/55516284-111c4480-566d-11e9-86f1-417ddf048d7e.gif)

- Syntax highlighting
- Autocomplete (provided via the LSP module, WIP)
- Linting
- Formatting (WIP)

## Development

1) Install all dependencies

```sh
npm install
```

2) Mark package as development package

```sh
apm develop
```

3) Launch Atom as development instance

```sh
atom -d
```

This allows will enable the Developer Tools in "View -> Developer". Most notable it includes:

- Reload window (Ctrl-Shift-F5)
- Toggle developer console (Ctrl-Shift-I)

### Development tips

#### Automatically recompile the extension

Use Typescript's `watch` to monitor all Typescript files and automatically recompile the extension:

```sh
tsc -w
```
