const fetcher = {
    parseVideoData($item) {
        let $a = $item.find(`.video-thumb-inner a`);
        return {
            type: "img-card",
            key: $a.href(),
            img: $a.find("img").attr("data-src"),
            ratio: 22 / 39,
            title: $item.find(`.thumb_video_name`).eq(0).text().trim(),
            tags: [$item.find(`.title-and-resolution .resolution`).text(), $item.find(`.title-and-resolution .duration`).text()],
            action: {
                type: "link",
                path: {
                    type: "video",
                    href: $a.href(),
                    title: $item.find(`.thumb_video_name`).eq(0).text().trim(),
                    thumb: $a.find("img").attr("data-src")
                }
            }
        };
    },
    async sort(href, page) {
        href = new mg.MURL(href).setQuery({
            page,
        }).href;
        const $ = await mg.nio.dom(href);
        const list = $(`.video-responsive.video-listing-item`).mmap(this.parseVideoData);
        return {
            list,
            totalPages: +$(`.pagination .pageof`).text().trim().match(/(\d+)$/)[1]
        };
    },
    async video(href, console) {
        const $ = await mg.nio.dom(href);

        let list = [];
        let id = $(`[clip-id]`).attr("clip-id");
        let searchString = (JSON.parse($(`script:contains(window.relatedSearchStringVidevo)`).html().match(/window\.relatedSearchStringVidevo\s*=\s*(.*);/)[1]));

        {
            //  获取相似视频
            let href = new mg.MURL(`https://www.videvo.net/api/?path=elasticsearch/listResults`).setQuery({
                params: JSON.stringify({
                    "search": searchString,
                    "is_audio": 0,
                    "video_id": id,
                    "similar_clips": true, "json_return": true, "language": "", "sort": "relevance", "rec": 24
                })
            }).href;
            let json = await mg.nio.json(href);
            list = json.elements.filter(s => s.includes(`video-responsive`)).map(html => {
                return this.parseVideoData(mg.parseDOM(html, href)(".video-responsive"));
            });
        }

        return {
            videoUrl: $("#video source").attr("src"),
            list
        }
    },
    async collection(href, page) {
        let category = "coll_" + href.match(/collections\/([^\/]*)\//)[1].replace(/-/g, "_");
        href = new mg.MURL(`https://www.videvo.net/api/?path=elasticsearch/listResults`).setQuery({
            params: JSON.stringify({
                "site_url": href,
                "page_slug": "collections",
                "category": category,
                "category_en_version": category,
                "clip_type_translated": null,
                "videvo_widget": 0,
                "default_category_slug": "stock-video-footage",
                "rec": 72,
                "free_ratio": 10,
                "load_more_btn": false,
                "pge": page,
                "json_return": true
            })
        }).href;
        let json = await mg.nio.json(href);
        list = json.elements.filter(s => s.includes(`video-responsive`)).map(html => {
            return this.parseVideoData(mg.parseDOM(html, href)(".video-responsive"));
        });
        return {
            list,
            totalPages: json.total_pages,
            ended: page >= json.total_pages - 1
        }
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
            column: this.path.type == "home" ? 3 : 1,
            hasTopVideo: this.path.type == "video"
        };
    }
    async pageResolver(page) {
        if (this.path.type == "home") {
            const collectionsApiUrl = "https://www.videvo.net/api/?path=category/get-all-collections&params={%22rec%22:36,%22ads_after_rec%22:0,%22sort%22:%22collections%22,%22is_audio%22:false,%22collection_type%22:%22popular%22,%22is_homepage%22:true,%22get_active%22:true,%22homepage%22:true,%22json_return%22:true}";
            const list = [
                {
                    type: "hot-links",
                    links: [{
                        href: "https://www.videvo.net/free-stock-footage/sort/popular/?page=0&is_ajax=true",
                        tag: "Popular"
                    }, {
                        href: "https://www.videvo.net/free-stock-footage/sort/newest/?page=0&is_ajax=true",
                        tag: "Newest"
                    }, {
                        href: "https://www.videvo.net/free-stock-footage/sort/random/?page=0&is_ajax=true",
                        tag: "Random"
                    }].map(({ href, tag }) => {
                        return {
                            text: tag,
                            action: {
                                type: "link",
                                path: {
                                    type: "sort",
                                    href,
                                    title: tag
                                }
                            }
                        };
                    })
                },
                ...(await mg.nio.json(collectionsApiUrl)).rows.map(row => {
                    return {
                        type: "img-card",
                        key: row.id,
                        img: new mg.MURL(collectionsApiUrl, row.banner).href,
                        ratio: 1,
                        title: row.name,
                        tags: [row.no_videos + "个视频"],
                        action: {
                            type: "link",
                            path: {
                                type: "collection",
                                href: new mg.MURL(collectionsApiUrl, row.url).href,
                                title: `集 ${row.name}`
                            }
                        }
                    }
                })
            ];
            return {
                list,
                ended: true
            };
        } else if (this.path.type == "sort") {
            return await fetcher.sort(this.path.href, page);
        } else if (this.path.type == "video") {
            this.manager.setTopVideo({
                poster: this.path.thumb
            });
            const { videoUrl, list } = await fetcher.video(this.path.href, this.console);
            this.manager.setTopVideo({
                url: videoUrl
            });
            return {
                list,
                ended: true
            }
        } else if (this.path.type == "collection") {
            return await fetcher.collection(this.path.href, page);
        }

    }
}
Provider.manifest = {
    name: "会动的Videvo",
    uniqueName: "com.mg.example.videvo",
    icon: "https://www.videvo.net/wp-content/themes/ViDEVO/images/favicon.ico",
};

mg.Provider = Provider;