const urlPattern = new RegExp(
    /(?:^|[^\w@\-#$/\.])/.source +
        "(" +
        /(?:https?:\/\/)?(?:(?:[^\W_]+|[^\W_][a-zA-Z0-9\-]*[^\W_])+\.)+/
            .source +
        // `(?:${tld})` +
        "com" +
        /(?:\/(?:[\w\-#=+]*[~!@$%&*\[\];:'\|,\.\?]+[\w\-#=+]+|[\w\-#=+]*))*/
            .source +
        ")" +
        /(?:$|[^a-zA-Z0-9@\-+])/.source,
    "gmi"
);
const hashatgPattern = /\w/gim;
const mentionPattern = /\w/gim;
const cashatgPattern = /\w/gim;

export { urlPattern, hashatgPattern, mentionPattern, cashatgPattern };
