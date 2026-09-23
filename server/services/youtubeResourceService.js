const LearningResource =
    require("../models/LearningResource");

const {
    resolveSkill
} =
    require("./learningResourceService");


/*
============================================================
CONFIG
============================================================
*/

const YOUTUBE_SEARCH_URL =
    "https://www.googleapis.com/youtube/v3/search";

const YOUTUBE_VIDEOS_URL =
    "https://www.googleapis.com/youtube/v3/videos";


const VALID_LEVELS =
    new Set([
        "beginner",
        "intermediate",
        "advanced",
        "all"
    ]);


/*
============================================================
HELPERS
============================================================
*/

const normalizeText = (
    value
) => {

    return String(
        value || ""
    )
        .trim()
        .replace(
            /\s+/g,
            " "
        );
};


const normalizeLower = (
    value
) => {

    return normalizeText(
        value
    ).toLowerCase();
};


const safeArray = (
    value
) => {

    return Array.isArray(
        value
    )
        ? value
        : [];
};


const safeNumber = (
    value,
    fallback = 0
) => {

    const parsed =
        Number(
            value
        );


    return Number.isFinite(
        parsed
    )
        ? parsed
        : fallback;
};


const clamp = (
    value,
    min,
    max
) => {

    return Math.max(
        min,
        Math.min(
            max,
            value
        )
    );
};


const parseBoolean = (
    value,
    fallback = false
) => {

    if (
        typeof value ===
        "boolean"
    ) {

        return value;
    }


    if (
        typeof value !==
        "string"
    ) {

        return fallback;
    }


    const normalized =
        value
            .trim()
            .toLowerCase();


    if (
        [
            "true",
            "1",
            "yes",
            "on"
        ].includes(
            normalized
        )
    ) {

        return true;
    }


    if (
        [
            "false",
            "0",
            "no",
            "off"
        ].includes(
            normalized
        )
    ) {

        return false;
    }


    return fallback;
};


/*
============================================================
YOUTUBE ENABLED
============================================================
*/

const isYouTubeEnabled =
    () => {

        return (
            parseBoolean(
                process.env
                    .YOUTUBE_ENABLED,
                true
            ) &&
            Boolean(
                normalizeText(
                    process.env
                        .YOUTUBE_API_KEY
                )
            )
        );
};


/*
============================================================
CONFIG VALUES
============================================================
*/

const getCacheTtlHours =
    () => {

        return clamp(
            safeNumber(
                process.env
                    .YOUTUBE_CACHE_TTL_HOURS,
                24
            ),
            1,
            168
        );
};


const getDefaultMaxResults =
    () => {

        return clamp(
            safeNumber(
                process.env
                    .YOUTUBE_MAX_RESULTS,
                6
            ),
            1,
            20
        );
};


const getRegionCode =
    () => {

        return normalizeText(
            process.env
                .YOUTUBE_REGION_CODE ||
            "IN"
        )
            .toUpperCase();
};


const getRelevanceLanguage =
    () => {

        return normalizeText(
            process.env
                .YOUTUBE_RELEVANCE_LANGUAGE ||
            "en"
        );
};


const getSafeSearch =
    () => {

        const value =
            normalizeLower(
                process.env
                    .YOUTUBE_SAFE_SEARCH ||
                "strict"
            );


        if (
            [
                "none",
                "moderate",
                "strict"
            ].includes(
                value
            )
        ) {

            return value;
        }


        return "strict";
};


/*
============================================================
HTML ENTITY DECODING
============================================================

YouTube snippets may contain escaped entities.

============================================================
*/

const decodeHtmlEntities = (
    value
) => {

    return String(
        value || ""
    )
        .replace(
            /&amp;/g,
            "&"
        )
        .replace(
            /&quot;/g,
            "\""
        )
        .replace(
            /&#39;/g,
            "'"
        )
        .replace(
            /&lt;/g,
            "<"
        )
        .replace(
            /&gt;/g,
            ">"
        );
};


/*
============================================================
ISO 8601 DURATION
============================================================

Example:

PT1H15M33S

becomes:

1h 15m 33s

============================================================
*/

const parseYouTubeDuration = (
    duration
) => {

    const value =
        String(
            duration || ""
        );


    const match =
        value.match(
            /^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/
        );


    if (
        !match
    ) {

        return "";
    }


    const hours =
        safeNumber(
            match[1]
        );

    const minutes =
        safeNumber(
            match[2]
        );

    const seconds =
        safeNumber(
            match[3]
        );


    const parts =
        [];


    if (
        hours > 0
    ) {

        parts.push(
            `${hours}h`
        );
    }


    if (
        minutes > 0
    ) {

        parts.push(
            `${minutes}m`
        );
    }


    if (
        seconds > 0 &&
        hours === 0
    ) {

        parts.push(
            `${seconds}s`
        );
    }


    return (
        parts.join(" ") ||
        "0m"
    );
};


/*
============================================================
TOPIC NORMALIZATION
============================================================
*/

const normalizeTopics = (
    topics
) => {

    let values =
        topics;


    if (
        typeof topics ===
        "string"
    ) {

        values =
            topics.split(",");
    }


    return [
        ...new Set(

            safeArray(
                values
            )
                .map(
                    normalizeText
                )
                .filter(
                    Boolean
                )
        )
    ]
        .slice(
            0,
            5
        );
};


/*
============================================================
LEVEL NORMALIZATION
============================================================
*/

const normalizeLevel = (
    level
) => {

    const normalized =
        normalizeLower(
            level ||
            "all"
        );


    return VALID_LEVELS
        .has(
            normalized
        )

        ? normalized

        : "all";
};


/*
============================================================
QUERY BUILDER
============================================================
*/

const buildYouTubeSearchQuery = ({
    skillName,
    topics = [],
    level = "all"
}) => {

    const queryParts = [
        skillName
    ];


    /*
    Limit topic count to reduce overly-specific searches.
    */

    normalizeTopics(
        topics
    )
        .slice(
            0,
            2
        )
        .forEach(
            (
                topic
            ) => {

                queryParts.push(
                    topic
                );
            }
        );


    if (
        level !==
        "all"
    ) {

        queryParts.push(
            level
        );
    }


    queryParts.push(
        "tutorial"
    );


    return normalizeText(
        queryParts.join(" ")
    );
};


/*
============================================================
CACHE KEY
============================================================
*/

const createQueryKey = ({
    skillName,
    topics,
    level,
    language,
    regionCode
}) => {

    return [
        normalizeLower(
            skillName
        ),

        normalizeTopics(
            topics
        )
            .map(
                normalizeLower
            )
            .sort()
            .join("|"),

        normalizeLower(
            level
        ),

        normalizeLower(
            language
        ),

        normalizeLower(
            regionCode
        )
    ].join("::");
};


/*
============================================================
THUMBNAIL
============================================================
*/

const getBestThumbnail = (
    thumbnails
) => {

    return (
        thumbnails
            ?.maxres
            ?.url ||

        thumbnails
            ?.standard
            ?.url ||

        thumbnails
            ?.high
            ?.url ||

        thumbnails
            ?.medium
            ?.url ||

        thumbnails
            ?.default
            ?.url ||

        ""
    );
};


/*
============================================================
INTERNAL QUALITY SCORE
============================================================

This is only an internal ranking signal.

It is NOT an objective statement about video quality.

============================================================
*/

const calculateInternalQualityScore = ({
    rank,
    viewCount
}) => {

    const relevanceScore =
        Math.max(
            0,
            24 -
            (
                Math.max(
                    1,
                    rank
                ) -
                1
            ) *
            3
        );


    const views =
        Math.max(
            0,
            safeNumber(
                viewCount
            )
        );


    const popularityScore =
        Math.min(
            12,
            Math.log10(
                views + 1
            ) *
            2
        );


    return Math.round(
        clamp(
            55 +
            relevanceScore +
            popularityScore,
            55,
            92
        )
    );
};


/*
============================================================
API REQUEST
============================================================
*/

const requestYouTubeApi =
    async (
        url,
        params
    ) => {

        if (
            typeof fetch !==
            "function"
        ) {

            const error =
                new Error(
                    "Native fetch is unavailable. Use Node.js 18 or newer."
                );


            error.statusCode =
                500;


            throw error;
        }


        const apiKey =
            normalizeText(
                process.env
                    .YOUTUBE_API_KEY
            );


        if (
            !apiKey
        ) {

            const error =
                new Error(
                    "YOUTUBE_API_KEY is not configured."
                );


            error.statusCode =
                503;


            throw error;
        }


        const searchParams =
            new URLSearchParams({
                ...params,
                key:
                    apiKey
            });


        const response =
            await fetch(
                `${url}?${searchParams.toString()}`,
                {
                    method:
                        "GET",

                    headers: {
                        Accept:
                            "application/json"
                    },

                    signal:
                        AbortSignal.timeout(
                            10000
                        )
                }
            );


        let data =
            {};


        try {

            data =
                await response
                    .json();

        } catch {

            data =
                {};
        }


        if (
            !response.ok
        ) {

            const apiReason =

                data
                    ?.error
                    ?.errors
                    ?.[0]
                    ?.reason ||

                data
                    ?.error
                    ?.status ||

                `HTTP_${response.status}`;


            const apiMessage =

                data
                    ?.error
                    ?.message ||

                "YouTube API request failed.";


            const error =
                new Error(
                    apiMessage
                );


            error.statusCode =
                response.status;

            error.code =
                apiReason;

            error.youtubeError =
                data?.error;


            throw error;
        }


        return data;
    };


/*
============================================================
FORMAT DATABASE RESOURCE
============================================================
*/

const formatResource = (
    resource,
    skill
) => {

    return {

        id:
            resource
                ?._id
                ?.toString?.() ||
            resource
                ?.id ||
            null,

        skill: {
            id:
                skill
                    ?._id
                    ?.toString?.() ||
                skill
                    ?.id ||
                null,

            name:
                skill
                    ?.name ||
                ""
        },

        topic:
            resource
                ?.topic ||
            "General",

        level:
            resource
                ?.level ||
            "all",

        type:
            "youtube",

        title:
            resource
                ?.title ||
            "",

        description:
            resource
                ?.description ||
            "",

        provider:
            resource
                ?.provider ||
            "YouTube",

        url:
            resource
                ?.url ||
            "",

        thumbnailUrl:
            resource
                ?.thumbnailUrl ||
            "",

        externalId:
            resource
                ?.externalId ||
            "",

        duration:
            resource
                ?.duration ||
            "",

        language:
            resource
                ?.language ||
            "en",

        isFree:
            resource
                ?.isFree !==
            false,

        qualityScore:
            safeNumber(
                resource
                    ?.qualityScore
            ),

        tags:
            safeArray(
                resource
                    ?.tags
            ),

        source:
            resource
                ?.source ||
            "youtube-api",

        isVerified:
            Boolean(
                resource
                    ?.isVerified
            ),

        metadata:
            resource
                ?.metadata ||
            {}
    };
};


/*
============================================================
LOAD YOUTUBE CACHE
============================================================
*/

const loadYouTubeCache =
    async ({
        skill,
        queryKey,
        limit,
        freshOnly = true
    }) => {

        const filter = {

            skill:
                skill._id,

            type:
                "youtube",

            source:
                "youtube-api",

            isActive:
                true,

            "metadata.youtube.queryKey":
                queryKey
        };


        if (
            freshOnly
        ) {

            const cacheCutoff =
                new Date(
                    Date.now() -
                    getCacheTtlHours() *
                    60 *
                    60 *
                    1000
                );


            filter[
                "metadata.youtube.fetchedAt"
            ] = {
                $gte:
                    cacheCutoff
            };
        }


        const cached =
            await LearningResource
                .find(
                    filter
                )
                .sort({
                    "metadata.youtube.rank":
                        1
                })
                .limit(
                    limit
                )
                .lean();


        return cached.map(
            (
                resource
            ) =>
                formatResource(
                    resource,
                    skill
                )
        );
    };


/*
============================================================
CURATED YOUTUBE FALLBACK
============================================================
*/

const loadCuratedYouTubeFallback =
    async ({
        skill,
        level,
        limit
    }) => {

        const levels =
            level ===
            "all"

                ? [
                    "all",
                    "beginner",
                    "intermediate",
                    "advanced"
                ]

                : [
                    level,
                    "all"
                ];


        const resources =
            await LearningResource
                .find({
                    skill:
                        skill._id,

                    type:
                        "youtube",

                    source:
                        "curated",

                    isVerified:
                        true,

                    isActive:
                        true,

                    level: {
                        $in:
                            levels
                    }
                })
                .sort({
                    qualityScore:
                        -1
                })
                .limit(
                    limit
                )
                .lean();


        return resources.map(
            (
                resource
            ) =>
                formatResource(
                    resource,
                    skill
                )
        );
    };


/*
============================================================
SEARCH YOUTUBE
============================================================
*/

const fetchYouTubeVideos =
    async ({
        query,
        maxResults,
        language,
        regionCode
    }) => {

        /*
        First API call:
        search.list
        */

        const searchResponse =
            await requestYouTubeApi(
                YOUTUBE_SEARCH_URL,
                {
                    part:
                        "snippet",

                    type:
                        "video",

                    q:
                        query,

                    maxResults:
                        String(
                            maxResults
                        ),

                    order:
                        "relevance",

                    safeSearch:
                        getSafeSearch(),

                    videoEmbeddable:
                        "true",

                    relevanceLanguage:
                        language,

                    regionCode:
                        regionCode
                }
            );


        const videoIds =
            safeArray(
                searchResponse
                    ?.items
            )
                .map(
                    (
                        item
                    ) =>
                        item
                            ?.id
                            ?.videoId
                )
                .filter(
                    Boolean
                );


        if (
            videoIds.length ===
            0
        ) {

            return [];
        }


        /*
        Second API call:
        videos.list

        Gives us:
        - duration
        - statistics
        - full snippet
        - embeddable/public status
        */

        const videosResponse =
            await requestYouTubeApi(
                YOUTUBE_VIDEOS_URL,
                {
                    part:
                        "snippet,contentDetails,statistics,status",

                    id:
                        videoIds.join(",")
                }
            );


        const videoMap =
            new Map(
                safeArray(
                    videosResponse
                        ?.items
                ).map(
                    (
                        video
                    ) => [
                        video.id,
                        video
                    ]
                )
            );


        /*
        Preserve search relevance order.
        */

        return videoIds
            .map(
                (
                    videoId
                ) =>
                    videoMap.get(
                        videoId
                    )
            )
            .filter(
                Boolean
            )
            .filter(
                (
                    video
                ) => {

                    if (
                        video
                            ?.status
                            ?.privacyStatus &&
                        video
                            .status
                            .privacyStatus !==
                            "public"
                    ) {

                        return false;
                    }


                    if (
                        video
                            ?.status
                            ?.embeddable ===
                        false
                    ) {

                        return false;
                    }


                    return true;
                }
            );
    };


/*
============================================================
SAVE API RESULTS TO CACHE
============================================================
*/

const cacheYouTubeVideos =
    async ({
        videos,
        skill,
        topics,
        level,
        language,
        regionCode,
        query,
        queryKey
    }) => {

        const now =
            new Date();


        const primaryTopic =

            normalizeTopics(
                topics
            )[0] ||

            "General";


        const savedResources =
            [];


        for (
            let index = 0;
            index < videos.length;
            index += 1
        ) {

            const video =
                videos[index];


            const snippet =
                video
                    ?.snippet ||
                {};


            const videoId =
                video
                    ?.id;


            if (
                !videoId
            ) {

                continue;
            }


            const url =
                `https://www.youtube.com/watch?v=${videoId}`;


            const duration =
                parseYouTubeDuration(
                    video
                        ?.contentDetails
                        ?.duration
                );


            const viewCount =
                safeNumber(
                    video
                        ?.statistics
                        ?.viewCount
                );


            const likeCount =
                safeNumber(
                    video
                        ?.statistics
                        ?.likeCount
                );


            const rank =
                index + 1;


            const qualityScore =
                calculateInternalQualityScore({
                    rank,
                    viewCount
                });


            const tags = [
                normalizeLower(
                    skill.name
                ),
                ...normalizeTopics(
                    topics
                )
                    .map(
                        normalizeLower
                    )
            ]
                .filter(
                    Boolean
                );


            const resourceData = {

                skill:
                    skill._id,

                topic:
                    primaryTopic,

                level:
                    level,

                type:
                    "youtube",

                title:
                    decodeHtmlEntities(
                        snippet
                            ?.title
                    ),

                description:
                    decodeHtmlEntities(
                        snippet
                            ?.description
                    ),

                provider:
                    decodeHtmlEntities(
                        snippet
                            ?.channelTitle ||
                        "YouTube"
                    ),

                url:
                    url,

                thumbnailUrl:
                    getBestThumbnail(
                        snippet
                            ?.thumbnails
                    ),

                externalId:
                    videoId,

                source:
                    "youtube-api",

                duration:
                    duration,

                language:
                    language,

                isFree:
                    true,

                /*
                Important:

                API results are not manually verified,
                therefore this stays FALSE.
                */

                isVerified:
                    false,

                lastVerifiedAt:
                    null,

                isActive:
                    true,

                qualityScore:
                    qualityScore,

                tags: [
                    ...new Set(
                        tags
                    )
                ],

                learningObjectives:
                    [],

                prerequisites:
                    [],

                metadata: {

                    youtube: {

                        query:
                            query,

                        queryKey:
                            queryKey,

                        rank:
                            rank,

                        videoId:
                            videoId,

                        channelId:
                            snippet
                                ?.channelId ||
                            "",

                        publishedAt:
                            snippet
                                ?.publishedAt ||
                            null,

                        viewCount:
                            viewCount,

                        likeCount:
                            likeCount,

                        rawDuration:
                            video
                                ?.contentDetails
                                ?.duration ||
                            "",

                        fetchedAt:
                            now,

                        regionCode:
                            regionCode,

                        relevanceLanguage:
                            language
                    }
                }
            };


            try {

                const resource =
                    await LearningResource
                        .findOneAndUpdate(
                            {
                                url:
                                    url
                            },
                            {
                                $set:
                                    resourceData
                            },
                            {
                                new:
                                    true,

                                upsert:
                                    true,

                                runValidators:
                                    true,

                                setDefaultsOnInsert:
                                    true
                            }
                        )
                        .lean();


                savedResources.push(
                    formatResource(
                        resource,
                        skill
                    )
                );


            } catch (
                error
            ) {

                console.warn(
                    `Unable to cache YouTube video ${videoId}:`,
                    error.message
                );
            }
        }


        return savedResources;
    };


/*
============================================================
MAIN LIVE YOUTUBE SERVICE
============================================================
*/

const getLiveYouTubeResources =
    async ({
        skill,
        topics = [],
        level = "all",
        limit = null,
        language = null,
        regionCode = null,
        forceRefresh = false
    }) => {

        const resolvedSkill =
            await resolveSkill(
                skill
            );


        const normalizedTopics =
            normalizeTopics(
                topics
            );


        const normalizedLevel =
            normalizeLevel(
                level
            );


        const finalLimit =
            clamp(
                safeNumber(
                    limit,
                    getDefaultMaxResults()
                ),
                1,
                12
            );


        const finalLanguage =
            normalizeText(
                language ||
                getRelevanceLanguage()
            );


        const finalRegionCode =
            normalizeText(
                regionCode ||
                getRegionCode()
            )
                .toUpperCase();


        const query =
            buildYouTubeSearchQuery({
                skillName:
                    resolvedSkill
                        .name,

                topics:
                    normalizedTopics,

                level:
                    normalizedLevel
            });


        const queryKey =
            createQueryKey({
                skillName:
                    resolvedSkill
                        .name,

                topics:
                    normalizedTopics,

                level:
                    normalizedLevel,

                language:
                    finalLanguage,

                regionCode:
                    finalRegionCode
            });


        /*
        ====================================================
        LIVE YOUTUBE DISABLED
        ====================================================
        */

        if (
            !isYouTubeEnabled()
        ) {

            const curated =
                await loadCuratedYouTubeFallback({
                    skill:
                        resolvedSkill,

                    level:
                        normalizedLevel,

                    limit:
                        finalLimit
                });


            return {

                enabled:
                    false,

                source:
                    "curated-fallback",

                query:
                    query,

                skill: {
                    id:
                        resolvedSkill
                            ._id
                            .toString(),

                    name:
                        resolvedSkill
                            .name
                },

                totalResources:
                    curated.length,

                resources:
                    curated,

                message:
                    "Live YouTube search is disabled or no API key is configured."
            };
        }


        /*
        ====================================================
        FRESH CACHE
        ====================================================
        */

        if (
            !forceRefresh
        ) {

            const cached =
                await loadYouTubeCache({
                    skill:
                        resolvedSkill,

                    queryKey:
                        queryKey,

                    limit:
                        finalLimit,

                    freshOnly:
                        true
                });


            if (
                cached.length >
                0
            ) {

                return {

                    enabled:
                        true,

                    source:
                        "youtube-cache",

                    query:
                        query,

                    skill: {
                        id:
                            resolvedSkill
                                ._id
                                .toString(),

                        name:
                            resolvedSkill
                                .name
                    },

                    totalResources:
                        cached.length,

                    resources:
                        cached
                };
            }
        }


        /*
        ====================================================
        LIVE API
        ====================================================
        */

        try {

            const videos =
                await fetchYouTubeVideos({
                    query:
                        query,

                    maxResults:
                        finalLimit,

                    language:
                        finalLanguage,

                    regionCode:
                        finalRegionCode
                });


            const cachedResources =
                await cacheYouTubeVideos({
                    videos:
                        videos,

                    skill:
                        resolvedSkill,

                    topics:
                        normalizedTopics,

                    level:
                        normalizedLevel,

                    language:
                        finalLanguage,

                    regionCode:
                        finalRegionCode,

                    query:
                        query,

                    queryKey:
                        queryKey
                });


            if (
                cachedResources.length >
                0
            ) {

                return {

                    enabled:
                        true,

                    source:
                        "youtube-api",

                    query:
                        query,

                    skill: {
                        id:
                            resolvedSkill
                                ._id
                                .toString(),

                        name:
                            resolvedSkill
                                .name
                    },

                    fetchedAt:
                        new Date(),

                    totalResources:
                        cachedResources
                            .length,

                    resources:
                        cachedResources
                };
            }


        } catch (
            error
        ) {

            console.warn(
                "YouTube API unavailable:",
                {
                    message:
                        error.message,

                    code:
                        error.code,

                    status:
                        error.statusCode
                }
            );
        }


        /*
        ====================================================
        STALE API CACHE FALLBACK
        ====================================================
        */

        const staleCache =
            await loadYouTubeCache({
                skill:
                    resolvedSkill,

                queryKey:
                    queryKey,

                limit:
                    finalLimit,

                freshOnly:
                    false
            });


        if (
            staleCache.length >
            0
        ) {

            return {

                enabled:
                    true,

                source:
                    "youtube-stale-cache",

                query:
                    query,

                skill: {
                    id:
                        resolvedSkill
                            ._id
                            .toString(),

                    name:
                        resolvedSkill
                            .name
                },

                totalResources:
                    staleCache.length,

                resources:
                    staleCache,

                message:
                    "Live YouTube search was unavailable. Cached recommendations were returned."
            };
        }


        /*
        ====================================================
        CURATED FALLBACK
        ====================================================
        */

        const curated =
            await loadCuratedYouTubeFallback({
                skill:
                    resolvedSkill,

                level:
                    normalizedLevel,

                limit:
                    finalLimit
            });


        return {

            enabled:
                true,

            source:
                "curated-fallback",

            query:
                query,

            skill: {
                id:
                    resolvedSkill
                        ._id
                        .toString(),

                name:
                    resolvedSkill
                        .name
            },

            totalResources:
                curated.length,

            resources:
                curated,

            message:
                "Live YouTube results were unavailable. Curated recommendations were returned."
        };
    };


/*
============================================================
EXPORT
============================================================
*/

module.exports = {

    getLiveYouTubeResources,

    buildYouTubeSearchQuery,

    parseYouTubeDuration,

    normalizeTopics,

    isYouTubeEnabled
};