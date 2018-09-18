# vscode-phpcbf

[![Current Version](https://vsmarketplacebadge.apphb.com/version/ValeryanM.vscode-phpcbf.svg)](https://marketplace.visualstudio.com/items?itemName=ValeryanM.vscode-phpcbf)
[![Install Count](https://vsmarketplacebadge.apphb.com/installs/ValeryanM.vscode-phpcbf.svg)](https://marketplace.visualstudio.com/items?itemName=ValeryanM.vscode-phpcbf)
[![Open Issues](https://vsmarketplacebadge.apphb.com/rating/ValeryanM.vscode-phpcbf.svg)](https://marketplace.visualstudio.com/items?itemName=ValeryanM.vscode-phpcbf)

This linter plugin for [Visual Studio Code](https://code.visualstudio.com/) provides an interface to [phpcbf](http://pear.php.net/package/PHP_CodeSniffer/). It will be used with files that have the “PHP” language mode. This extension is designed to compliment the [phpcs](https://github.com/ikappas/vscode-phpcs/) extension and uses the same auto configuration search mechanism to apply rulesets to files within a workspace.

## Installation

Visual Studio Code must be installed in order to use this plugin. If Visual Studio Code is not installed, please follow the instructions [here](https://code.visualstudio.com/Docs/editor/setup).

## Usage

<kbd>F1</kbd> -> `phpcbf: fix this file`

or keyboard shortcut `alt+shift+f` vs code default formatter shortcut

or right mouse context menu `Format Document`

or if format on save is enabled save document

## Linter Installation

Before using this plugin, you must ensure that `phpcbf` is installed on your system. The preferred method is using [composer](https://getcomposer.org/) for both system-wide and project-wide installations.

Once phpcbf is installed, you can proceed to install the vscode-phpcbf plugin if it is not yet installed.

> **NOTE:** This plugin can detect whether your project has been set up to use phpcbf via composer and use the project specific `phpcbf` over the system-wide installation of `phpcbf` automatically. This feature requires that both composer.json and composer.lock file exist in your workspace root or the `phpcbf.composerJsonPath` in order to check for the composer dependency. If you wish to bypass this feature you can set the `phpcbf.executablePath` configuration setting.

> **NOTE:** `phpcbf` is installed along with `phpcs`.

### System-wide Installation

The `phpcbf` linter can be installed globally using the Composer Dependency Manager for PHP.

1. Install [composer](https://getcomposer.org/doc/00-intro.md).
1. Require `phpcs` package by typing the following in a terminal:

    ```bash
    composer global require squizlabs/php_codesniffer
    ```

### Project-wide Installation

The `phpcs` linter can be installed in your project using the Composer Dependency Manager for PHP.

1. Install [composer](https://getcomposer.org/doc/00-intro.md).
1. Require `phpcs` package by typing the following at the root of your project in a terminal:

    ```bash
    composer require --dev squizlabs/php_codesniffer
    ```

### Plugin Installation

1. Open Visual Studio Code.
1. Press `Ctrl+P` on Windows or `Cmd+P` on Mac to open the Quick Open dialog.
1. Type ext install phpcbf to find the extension.
1. Press Enter or click the cloud icon to install it.
1. Restart Visual Studio Code when prompted.

## Basic Configuration

There are various options that can be configured to control how the plugin operates which can be set
in your user, workspace or folder preferences.

### **phpcbf.enable**

[ *Scope:* All | Optional | *Type:* boolean | *Default:* true ]

This setting controls whether `phpcbf` linting is enabled.

### **phpcbf.executablePath**

[ *Scope:* All | Optional | *Type:* string | *Default:* null ]

This setting controls the executable path for the `phpcbf`. You may specify the absolute path or workspace relative path to the `phpcbf` executable.
If omitted, the plugin will try to locate the path parsing your composer configuration or the global path.

### **phpcbf.standard**

[ *Scope:* All | Optional | *Type:* string | *Default:* null ]

This setting controls the coding standard used by `phpcbf`. You may specify the name, absolute path or workspace relative path of the coding standard to use.

> **NOTE:** While using composer dependency manager over global installation make sure you use the phpcbf commands under your project scope !

The following values are applicable:

1. This setting can be set to `null`, which is the default behavior and uses the `default_standard` when set in the `phpcbf` configuration or fallback to the `Pear` coding standard.

    ```json
    {
        "phpcbf.standard": null
    }
    ```

    You may set the `default_standard` used by phpcbf using the following command:

    ```bash
    phpcs --config-set default_standard <value>
    ```

    or when using composer dependency manager from the root of your project issue the following command:

    ```bash
    ./vendor/bin/phpcs --config-set default_standard <value>
    ```

1. The setting can be set to the name of a built-in coding standard ( ie. `MySource`, `PEAR`, `PHPCS`, `PSR1`, `PSR2`, `Squiz`, `Zend` ) and you are good to go.

    ```json
    {
        "phpcbf.standard": "PSR2"
    }
    ```

1. The setting can be set to the name of a custom coding standard ( ie. `WordPress`, `Drupal`, etc. ). In this case you must ensure that the specified coding standard is installed and accessible by `phpcbf`.

    ```json
    {
        "phpcbf.standard": "WordPress"
    }
    ```

    After you install the custom coding standard, you can make it available to phpcbf by issuing the following command:

    ```bash
    phpcs --config-set installed_paths <path/to/custom/coding/standard>
    ```

    or when using composer dependency manager from the root of your project issue the following command:

    ```bash
    ./vendor/bin/phpcs --config-set installed_paths <path/to/custom/coding/standard>
    ```

1. The setting can be set to the absolute path to a custom coding standard:

    ```json
    {
        "phpcbf.standard": "/path/to/coding/standard"
    }
    ```

    or you can use the path to a custom ruleset:

    ```json
    {
        "phpcbf.standard": "/path/to/project/phpcs.xml"
    }
    ```

1. The setting can be set to your workspace relative path to a custom coding standard:

    ```json
    {
        "phpcbf.standard": "./vendor/path/to/coding/standard"
    }
    ```

    or you can use the path to your project's custom ruleset:

    ```json
    {
        "phpcbf.standard": "./phpcs.xml"
    }
    ```

### **phpcbf.autoConfigSearch**

[ *Scope:* All | Optional | *Type:* boolean | *Default:* true ]

Automatically search for any `.phpcs.xml`, `.phpcs.xml.dist`, `phpcs.xml`, `phpcs.xml.dist`, `phpcs.ruleset.xml` or `ruleset.xml` file to use as configuration. Overrides `phpcbf.standard` configuration when a ruleset is found. If `phpcs` finds a configuration file through auto search this extension should similarly find that configuration file and apply fixes based on the same configuration.

> **NOTE:** This option does not apply for unsaved documents (in-memory). Also, the name of files that are searched for is configurable in this extension.

### **phpcbf.allowedAutoRulesets**

[ *Scope:* All | Optional | *Type:* array | *Default:* [] ]

An array of filenames that could contain a valid phpcs ruleset.

```json
{
    "phpcbf.allowedAutoRulesets": [
        "phpcs.xml",
        "special.xml",
    ]
}
```

## Advanced Configuration

### **phpcbf.composerJsonPath**

[ *Scope:* All | Optional | *Type:* string | *Default:* composer.json ]

This setting allows you to override the path to your composer.json file when it does not reside at the workspace root. You may specify the absolute path or workspace relative path to the `composer.json` file.

## Diagnosing common errors

### **phpcbf.debug**

[ *Scope:* All | Optional | *Type:* boolean | Default: false ]

Write phpcbf stdout and extra debug information out to the console.

### The phpcbf report contains invalid json

This error occurs when something goes wrong in phpcbf execution such as PHP Notices, PHP Fatal Exceptions, Other Script Output, etc, most of which can be detected as follows:

Execute the phpcbf command in your terminal with --report=json and see whether the output contains anything other than valid json.

## Acknowledgements

This extension is based off of the `phpcs` extension created by [Ioannis Kappas](https://github.com/ikappas/vscode-phpcs/) and the existing `phpcbf` extension by [Per Søderlind](https://github.com/soderlind/vscode-phpcbf/). It uses some portions of both extensions to provide the `phpcbf` functionality with auto config search.

## Contributing and Licensing

The project is hosted on [GitHub](https://github.com/valeryan/vscode-phpcbf) where you can [report issues](https://github.com/valeryan/vscode-phpcbf/issues), fork
the project and submit pull requests. See the [development guide](https://github.com/valeryan/vscode-phpcbf/blob/master/DEVELOPMENT.md) for details.

The project is available under [MIT license](https://github.com/valeryan/vscode-phpcbf/blob/master/LICENSE.md), which allows modification and
redistribution for both commercial and non-commercial purposes.
