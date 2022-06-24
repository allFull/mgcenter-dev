let manifest = ({
    name: "不会动的Unsplash",
    uniqueName: "com.mg.example.unsplash",
    icon: "https://unsplash.com/apple-touch-icon.png",
});


const fetcher = {
    async photos(href, page) {
        href = new mg.MURL(href).setQuery({
            page: page + 1,
            _t: Math.floor(Date.now() / (1000 * 60))
        }).href;
        let photos = await mg.nio.json(href);
        photos = photos.results || photos;
        let list = photos.map(({ urls, width, height, description, id }) => {
            return {
                type: "img-card",
                key: id,
                img: urls.small,
                higherImg: urls.regular,
                ratio: height / width,
                title: description && description.trim(),
                action: {
                    type: "image",
                    img: urls.full,
                    lowerImg: urls.small
                }
            };
        });
        return list;
    }
};

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
            column: 2
        };
    }
    async pageResolver(page, isTopPage) {
        let list;
        if (this.path.type == "home") {
            list = await fetcher.photos(`https://unsplash.com/napi/photos?per_page=12`, page);
            if (isTopPage) {
                const links = [{
                    href: "https://unsplash.com/napi/topics/wallpapers/photos?page=4&per_page=10",
                    tag: "Wallpapers"
                }, {
                    href: "https://unsplash.com/napi/topics/3d-renders/photos?page=4&per_page=10",
                    tag: "3D Renders"
                }, {
                    href: "https://unsplash.com/napi/topics/textures-patterns/photos?page=4&per_page=10",
                    tag: "Textures & Patterns"
                }, {
                    href: "https://unsplash.com/napi/topics/experimental/photos?page=4&per_page=10",
                    tag: "Experimental"
                }, {
                    href: "https://unsplash.com/napi/topics/architecture/photos?page=4&per_page=10",
                    tag: "Architecture"
                }, {
                    href: "https://unsplash.com/napi/topics/nature/photos?page=4&per_page=10",
                    tag: "Nature"
                }, {
                    href: "https://unsplash.com/napi/topics/business-work/photos?page=4&per_page=10",
                    tag: "Business & Work"
                }, {
                    href: "https://unsplash.com/napi/topics/fashion/photos?page=4&per_page=10",
                    tag: "Fashion"
                }, {
                    href: "https://unsplash.com/napi/topics/film/photos?page=4&per_page=10",
                    tag: "Film"
                }].map(({ href, tag }) => {
                    return {
                        text: tag,
                        action: {
                            type: "link",
                            path: {
                                type: "topic",
                                href,
                                title: `分类 ${tag}`
                            }
                        }
                    };
                });
                list.unshift({
                    type: "hot-links",
                    links: links.slice(0, 5)
                });
                list.splice(2, 0, {
                    type: "hot-links",
                    links: links.slice(5)
                });
            }
        } else if (this.path.type == "topic") {
            list = await fetcher.photos(this.path.href, page);
        } else if (this.path.type == "search") {
            list = await fetcher.photos(
                new mg.MURL(`https://unsplash.com/napi/search/photos?query=tree&per_page=20&page=2&xp=`).setQuery({
                    query: this.path.keyword
                }).href,
                page
            );
        }

        return { list };
    }
}
Provider.manifest = manifest;

mg.Provider = Provider;