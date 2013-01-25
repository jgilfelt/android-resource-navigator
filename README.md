Android Resource Navigator
==========================

A Google Chrome Extension providing enhanced resource navigation for GitHub hosted Android projects.

Features
--------

### Linkified XML resources

Android XML resources viewed on GitHub are processed so that any contained resource identifiers will link directly to the appropriate external file or specific declaration line where appropriate.

![feature-linkify](https://raw.github.com/jgilfelt/android-resource-navigator/master/screenshots/feature-linkify.png "feature-linkify")

### Framework styles browser action

Quickly open the Android framework styles or themes XML via an always available browser action button.

![feature-browser-action](https://raw.github.com/jgilfelt/android-resource-navigator/master/screenshots/feature-browser-action.png "feature-browser-action")

### Framework styles search omnibox

Type 'arn ' followed by a search term into the address bar to find a particular Android framework style or theme. Use the suggestions to navigate directly to the appropriate XML resource definition.

![feature-omnibox](https://raw.github.com/jgilfelt/android-resource-navigator/master/screenshots/feature-omnibox.png "feature-omnibox")

Caveats
-------

This is currently beta quality code and there are many known [limitations and issues](https://github.com/jgilfelt/android-resource-navigator/issues).

Resource links are resolved according to certain file naming conventions that are common (but not required) in Android projects. Since resource types can be and often are defined in multiple files, it does guarantee that all links will be successfully resolved. 

To better support projects that use alternate resource file naming conventions, you can override the defaults by providing a JSON map keyed with a regex string matching the owner/project. This is managed within the extension's options.

An example override for all forks of the popular [ActionBarSherlock](https://github.com/JakeWharton/ActionBarSherlock) project would be:

    {
        ".*/ActionBarSherlock": {
            "string": "abs__strings.xml",
            "color": "abs__colors.xml",
            "style": "abs__styles.xml",
            "dimen": "abs__dimens.xml",
            "bool": "abs__bools.xml",
            "id": "abs__ids.xml",
            "attr": "abs__attrs.xml",
            "integer": "abs__integers.xml",
            "array": "abs__arrays.xml"
        }
    }

Credits
-------

Author: [Jeff Gilfelt](https://github.com/jgilfelt)

Original omnibox search code by Roman Nurik

License
-------

    Copyright 2013 readyState Software Limited

    Licensed under the Apache License, Version 2.0 (the "License");
    you may not use this file except in compliance with the License.
    You may obtain a copy of the License at

       http://www.apache.org/licenses/LICENSE-2.0

    Unless required by applicable law or agreed to in writing, software
    distributed under the License is distributed on an "AS IS" BASIS,
    WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
    See the License for the specific language governing permissions and
    limitations under the License.
