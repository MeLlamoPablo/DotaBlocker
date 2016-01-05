# [DotaBlocker](http://mellamopablo.github.io/DotaBlocker/)

DotaBlocker is simple web app to help Dota players decide his item build in a match: upon entering the enemy lineup, DotaBlocker will display wich spells are blocked by Black King Bar and Linken's Sphere, and wich aren't.

The app is easy to use, but also easy to mantain: every information about the game that DotaBlocker needs is stored in `data/heroes.json`, and nothing is hardcoded, meaning that it will be easy to adapt it to potential future changes to Dota 2's gameplay.

DotaBlocker is written in JavaScript and doesn't depend on a server. Therefore, you can download it from the [release page](https://github.com/MeLlamoPablo/DotaBlocker/releases/) if you wish. However, keep in mind that you will need to manually update it.

## Third party libraries

This app uses the following, awesome third party libraries:

* [Bootstrap](https://github.com/twbs/bootstrap)
* [jQuery](https://github.com/jquery/jquery)
* [chosen](https://github.com/harvesthq/chosen)
* [chosen-bootstrap](https://github.com/dbtek/chosen-bootstrap)
