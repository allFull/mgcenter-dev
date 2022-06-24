# mgcenter-dev
MGCenter（会动的和不会动的）docs and examples. 

## 通述

### 简介

会动的和不会动的是一个媒体中心，展示图片和视频。

一个数据源脚本是一个获取和提供数据的JS脚本，它针对不同的 `path` 和 `page` 提供不同的数据，同时负责对 `path(路径)` 进行组织管理。

源脚本通过提供一个 `Provider` 类来工作，每一个页面都对应一个 `Provider` 实例，实例与实例之间应该是独立运行的，不应当产生关联。

所以源脚本是相对静态的，只是一个数据提供者。

### 页面

一个页面就是一个无限滚动的瀑布流列表，它拥有一个 `path` ， 对应一个 `Provider` 实例。

页面管理自身数据的页数，通过将相应的页数 `page` 传递给其 `Provider` 实例的 `pageResolver` 函数来获取信息，并将数据展示在列表中。

### `Provider` 类

一个 `Provider` 类的架构如下：

```javascript
class Provider {
    constructor({ path, manager, console }) {
        this.path = path;
        this.manager = manager;
        this.console = console;
    }
    init() {
        return {
            // showConsole: true,
            canSearch: true,
            column: this.path.type == "home" ? 2:1
        };
    }
    async pageResolver(page, isTopPage) {
        if (this.path.type == "home") {
            return {
                list:[]
            }
        } else if (this.path.type == "topic") {
            // ...
        } else if (this.path.type == "search") {
            // ...
        }
    }
}
Provider.manifest = ({
    name: "不会动的Unsplash",
    uniqueName: "com.mg.example.unsplash",
    icon: "https://unsplash.com/apple-touch-icon.png",
});

mg.Provider = Provider;
```

`Provider` 类应当拥有一个静态变量 `Provider.manifest` ，它提供关于该源脚本的一些基本信息。

每一个页面都会初始化一个 `Provider` 实例，它们往往拥有不同的 `path`。

`path` 等参数通过构造函数传递给 `Provider` 实例（需要自行实现构造函数来保存参数，如示例）。

一个 `Provider` 类应当实现两个函数，`init` 和 `pageResolver` 。`init` 函数可以针对不同的 `path` 返回不同的初始化信息，主要包括列数、能否搜索、是否拥有顶部视频。`pageResolver` 函数接受一个 `page(页数)` 参数，并返回其对应的列表 `list` 数据。

源脚本通过设置 `mg` 变量的 `Provider` 属性来将 `Provider` 类提供给应用。

### list

一个 `list` 的架构如下所示：

```javascript
[
    {
        type: "img-card",
        key: "unique-id-for-every-list-item",
        img: "https://example.com/abc.png",
        higherImg: "https://example.com/abc.source.png",
        ratio: 1.5,
        title: "图片对应的文字标题",
        action: {
            type: "image", // 用图片查看器打开
            img: "https://example.com/abc.source.png",
            lowerImg: "https://example.com/abc.png"
        }
    },
    {
        type: "hot-links",
        // ...
    },
    // ...
]
```

它是一个包含了很多项目的列表，每个项目都是一个拥有 `type` 属性和一些该 `type` 对应的数据属性的对象。

比如 `type: "img-card"` 表示一个图片卡片，它由一个图片和下面的文字组成，`img` 、 `title` 等是它对应的其余属性，其中 `action` 表示点击它触发的操作。

除了图片卡片之外，还有标签组 `hot-links` 等类型。

`pageResolver` 返回这些项目后，将被应用展示到瀑布流中。

### path

如我们之前所说，每个页面都拥有一个 `path` ，每个 `Provider` 实例也都拥有一个 `path` 。

`path` 表示一个路径，一般情况下它应该是一个对象。

通过设置列表项目的 `action` 属性，我们可以打开拥有相应 `path` 的页面。示例如下：

```javascript
list: [
    {
        type: "img-card",
        key: "unique-id-for-every-list-item",
        img: "https://example.com/abc.png",
        higherImg: "https://example.com/abc.source.png",
        ratio: 1.5,
        title: "图片对应的文字标题",
        action: {
            type: "link", // 将 action 的 type 属性设置为link
            path: {
                title: "一个相册的名称" 
                type: "album",
                href: "https://example.com/album/12345"
            }
        }
    },
    {
        type: "hot-links",
        // ...
    },
    // ...
]
```

将 `action` 属性中的 `type` 属性设置为 `link`，然后再设置一个 `path` 属性，当用户点击后，将打开一个该 `path` 对应的页面。

`path` 中的所有属性都不是必须的，如果拥有 `title` 属性，应用会将其设置为页面的标题。

`path` 中的其余属性可以自行定义，它都将被传送到新页面，提供给新页面的 `Provider` 实例。

数据源第一个页面的 `path` 为 `{type:"home"}`；搜索的 `path` 为 `{type:"search",keyword:"关键词"}`。

### 搜索

数据源可以提供搜索功能，只需要在 `init` 函数返回的对象中加入属性 `canSearch: true` 。

设置了搜索后，应用上方会出现一个搜索栏。用户触发搜索后，应用将打开一个 `path` 为 `{type:"search",keyword:"关键词"}` 的新页面。

### 视频

一个页面可以拥有一个视频播放器，它出现在页面的顶端，下面仍然为瀑布流列表。

要显示视频，需要在 `init` 函数返回的对象中加入属性 `hasTopVideo: true` 。

提示：`init` 函数可以针对不同 `path` 返回不同信息。

初次之外，需要使用传递给构造函数的 `manager` 中的 `setTopVideo` 函数，示例如下：

```javascript
manager.setTopVideo({
    poster: "https://...png", // 视频未载入时显示的占位图片
    url: "https://...mp4" // 视频地址
});
```

设置占位图片和视频地址的操作也可以分开进行。

视频支持各种格式，包括hls流媒体（m3u文件），只需要传入相应地址即可。（flv格式似乎不支持）

如果需要设置 `header`，可以使用 `source` 属性，示例如下：

```javascript
manager.setTopVideo({
    poster: "https://...png", // 视频未载入时显示的占位图片
    // url: "https://...mp4" // url属性不再需要
    source: {
        uri: "https://...mp4" // 注意这里是 uri
        headers: {
            referer: "https://example.com"
        }
    }
});
```

一个页面只能拥有一个顶部视频。

### `mg` 全局变量

应用提供了一些接口在 `mg` 全局变量中，用于进行网络请求和解析dom等操作。

`mg.axios` 用于发起网络请求。参考：[axios中文文档](https://axios-http.com/zh/docs/api_intro) 。

`mg.cheerio` 用于解析dom，提供了类似 `jQuery` 的方法。参考：[cheerio中文文档](https://github.com/cheeriojs/cheerio/wiki/Chinese-README) 。

除了上述两者之外，也可以使用包装过的功能 `mg.nio` , 拥有三个便捷函数：`mg.nio.dom` 、`mg.nio.json` 、`mg.nio.text` ，都返回 `Promise` 。

另外 `mg.MURL` 补充了处理URL的功能。

具体可以参考API部分。

### 开发和调试

应用针对开发做了一些有限的工作，目前便捷的开发流程：

1. 搭建一个本地http服务器（可使用 [http-server](https://github.com/http-party/http-server) ）。
2. 在该服务器上创建一个脚本， 并在 `init` 函数中返回属性 `showConsole: true`。
3. 在手机或模拟器上通过url安装该脚本。

设置 `showConsole` 属性后，每个页面下方会显示一个输出面板，面板右上角有一个刷新按钮，每次更改脚本后可以点击该按钮进行更新。

全局的 `console` 并不会显示在该面板上，必须使用传递给 `Provider` 构造函数的 `console` 对象，它拥有 `log` 和 `error` 两个方法。

脚本中的错误会展示在输出面板中，但是不在 `pageResolver` 流程中的异步函数中的错误可能不会显示，如果需要调试，需要自行捕捉并使用 `console` 对象来展示。

### 开发规范

数据源脚本应该是相对静态的，当用户需要时调用，调用结束便停止工作。

所以源脚本不应当在顶部执行任何耗时操作，包括网络请求等，所有工作应该在初始化 `Provider` 对象后，在 `pageResolver` 中进行。

`setTimeout`、`setInterval`、`fetch` 等在顶部是不可用的。

同时 `mg` 中提供的变量在顶部也是不存在的，只能用来设置 `mg.Provider`。

你可能想这样做来方便开发：
```javascript
const {axios, cheerio, nio} = mg;
```

但它在顶部是不可行的，因为它们还都不存在。

### 示例

examples 文件夹中包含两个示例，分别是图片源和视频源，可以自由参考。

## API

### `class Provider`

#### `static manifest`

| name       | type   | description                           |
| ---------- | ------ | ------------------------------------- |
| name       | string | 应用名                                |
| uniqueName | string | 类似包名，如：com.mg.example.unsplash |
| icon       | string | 图标地址，可以是 datauri              |

#### `constructor(pageProps{})`

##### `pageProps`

| name    | type   | description                                    |
| ------- | ------ | ---------------------------------------------- |
| path    | any    | 当前页面的路径                                 |
| manager | object | 针对当前页面的提供的一些功能                   |
| console | object | 输出到当前页面输出面板，拥有 log 和 error 方法 |

###### `path`

数据源第一个页面的 `path` 为 `{type:"home"}`；搜索的 `path` 为 `{type:"search",keyword:"关键词"}`；其余 `path` 为在 `action` 中 `path` 属性指定的值，理论上可能为任何类型。

###### `manager`

`manager.setTopVideo(object videoProps)`

`videoProps`

| name   | type   | description             |
| ------ | ------ | ----------------------- |
| url    | string | 视频url                 |
| poster | string | 占位图片url             |
| source | object | 视频源，设置后url将失效 |

`source`

| name    | type   | description             |
| ------- | ------ | ----------------------- |
| uri     | string | 视频url                 |
| headers | object | 请求时需要附送的headers |

###### `console`

输出到当前页面输出面板

#### `prototype object init()`

返回针对当前页面的一些设置信息

`object response`

| name              | type    | default | description                                                              |
| ----------------- | ------- | ------- | ------------------------------------------------------------------------ |
| column            | number  | 1       | 瀑布流列数                                                               |
| pagesPerLoading   | number  | 1       | 每次加载时加载的页面数，如果每个页面返回的结果比较少，可以将该值设为多个 |
| hasTopVideo       | boolean | false   | 是否拥有顶部视频                                                         |
| onlyVideo         | boolean | false   | 是否只有视频，为true时视频播放器将占满页面                               |
| canSearch         | boolean | false   | 是否支持搜索                                                             |
| extraSearchParams | any     | null    | 触发搜索后将附加到搜索页面的path属性中，可供源识别触发搜索的页面         |
| showConsole       | boolean | false   | 调试输出面板，发布时应设置为false                                        |


#### `prototype Promise object pageResolver(number page, boolean isTopPage)`

`number page`

需要加载的页数。

无限滚动的瀑布流列表通过页数来管理，页面会根据用户操作决定加载那一页。

`boolean isTopPage`

是否是最上面的一页。

因为页面可能会记录用户的浏览记录，或者用户可能会选择跳转到某页，所以不能通过 `page==0` 来判断是否是最上面一页。

可以通过该属性来为第一页添加一些内容。比如 unsplash 示例中的分类。

`object response`

| name       | type       | default | description                      |
| ---------- | ---------- | ------- | -------------------------------- |
| list       | ListItem[] | []      | 展示在瀑布流列表中的项目         |
| ended      | boolean    | false   | 是否已经到结尾，没有更多结果了   |
| totalPages | number     | null    | 总页数，如果设置，将显示在界面中 |

参考：[ListItem](#listitem)

### `mg` 全局变量

| name         | description                                                                                              |
| ------------ | -------------------------------------------------------------------------------------------------------- |
| axios        | 用于发起网络请求 [文档](https://axios-http.com/zh/docs/api_intro)                                        |
| cheerio      | 用于解析dom，提供了类似 `jQuery` 的方法 [文档](https://github.com/cheeriojs/cheerio/wiki/Chinese-README) |
| nio          | 简单包装的网络请求对象，绝大多数时候可以替代上面两者                                                     |
| MURL         | 简单的URL处理类                                                                                          |
| SearchParams | 简版的 URLSearchParams                                                                                   |
| parseDOM     | 包装过的cheerio，弥补了cheerio在获取href，src上的错误                                                    |

#### `cheerio$ parseDOM()`

`parseDOM(string dom, string url)`

`url`必须提供。

使用 `cheerio` `load`，另外提供了`href()`，`src()`，可以在 `url` 的基础上获取链接。

示例：
```javascript
const $ = mg.parseDOM("<html>...</html>", "https://example.com/abc");
$("div a").href();
$("div img").href();
```

cheerio$

| name   | type   | description    |
| ------ | ------ | -------------- |
| href() | string | 获取 href 属性 |
| src()  | string | 获取 src 属性  |

#### `class MURL`

`constructor(string base, string href)`

合成url。

`prototype string href`

href属性表示当前MURL对象的href。

`prototype setQuery(object)`

设置 `search` 参数

#### `class SearchParams`

实现：

```javascript
class SearchParams {
    map = new Map();
    constructor(search = "") {
        for (let [name, value] of search.split("&").filter(n => n).map(n => (n.split("=").map(s => decodeURIComponent(s))))) {
            this.map.set(name, value);
        }
    }
    set(key, value) {
        this.map.set(key, value);
    }
    toString() {
        let re = [];
        for (let [key, value] of this.map) {
            re.push(`${encodeURIComponent(key)}=${encodeURIComponent(value)}`);
        }
        return re.join("&");
    }
}
```

#### `nio`

| name       | type                | description          |
| ---------- | ------------------- | -------------------- |
| nio.json() | Promise json object | 请求并解析为json对象 |
| nio.dom()  | Promise cheerio$    | 请求并解析为cheerio$ |
| nio.text() | Promise string      | 请求并解析为文本     |

都接收一个 url 字符串或者一个 [axios config](https://axios-http.com/zh/docs/req_config) 对象。

示例：

```javascript
const $ = await nio.dom("https://example.com/abc");
$("div");
```

### types

#### `ListItem`

列表项目，通过 `type` 属性设置类型，每种类型都有各自的属性。

另外每个项目都应该拥有一个唯一的 `key` 属性，可以为图片 url 等，如果没有设置，将默认为 index 。

##### `type: 'img-card'`

图片卡片，上方图片，下方文字。文字最高两行，高出将隐藏。

| name       | type    | required | default | description                                                                                                                   |
| ---------- | ------- | -------- | ------- | ----------------------------------------------------------------------------------------------------------------------------- |
| img        | string  | 是       | -       | 图片url                                                                                                                       |
| higherImg  | string  | -        | -       | 更高质量的图片，与img同时设置用来优化体验，先展示img，然后网络允许，当获取到higherImg后加载高质量图片。只在column==1 时生效。 |
| title      | string  | -        | -       | 图片下文字，不设置将不显示文字                                                                                                |
| ratio      | number  | 是       | -       | 瀑布流使用，用于推测高度。column>1 时必需，如果没有设置，将获取第一张图片的比例，并统一使用                                   |
| forceRatio | boolean | -        | false   | column==1 时生效，设置为true时将强制使用设置的ratio，不然可能视图片真实比例做调整                                             |
| action     | Action  | -        | null    | 点击图片的动作 类型：[Action](#action)                                                                                        |

##### `type: 'hot-links'`

标签组，每个标签可以触发点击操作。

| name  | type   | required | default | description |
| ----- | ------ | -------- | ------- | ----------- |
| links | Link[] | 是       | -       | 标签数组    |

Link

| name   | type   | required | default | description                            |
| ------ | ------ | -------- | ------- | -------------------------------------- |
| text   | string | 是       | -       | 标签文字                               |
| action | Action | -        | -       | 点击标签的操作 类型：[Action](#action) |


##### `type: 'plain-text'`

一段纯文字。

| name | type   | required | default | description |
| ---- | ------ | -------- | ------- | ----------- |
| text | string | 是       | ""      | 文字        |

#### `Action`

一个对象，用来指定点击等操作的行为。通过 `type` 属性设置类型，每种类型都有各自的属性。

##### `type: 'link'`

点击后根据 `path` 打开新页面。

| name | type | required | default | description                                                                                                                       |
| ---- | ---- | -------- | ------- | --------------------------------------------------------------------------------------------------------------------------------- |
| path | any  | 是       | null    | 新页面的 path , 可以是一个对象，如果拥有 `title` 属性将被设置为标题， 如果拥有 `poster` 或者 `thumb` 属性将被设置为默认视频占位图 |

##### `type: 'image'`

使用图片查看器查看图片

| name     | type   | required | default | description                                                            |
| -------- | ------ | -------- | ------- | ---------------------------------------------------------------------- |
| img      | string | 是       | -       | 图片url                                                                |
| lowerImg | string | -        | -       | 低质量的url，在载入 img 之前显示，如果没有设置将尝试使用图片卡片的图片 |

##### `type: 'url'`

调用浏览器或者其他应用打开链接。

| name | type   | required | default | description            |
| ---- | ------ | -------- | ------- | ---------------------- |
| url  | string | 是       | -       | url，可以是 url scheme |
