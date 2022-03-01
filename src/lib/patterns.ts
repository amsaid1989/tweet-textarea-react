const hashatgPattern = /(?:^|\W)(#\w*[a-zA-Z]+\w*(?!:\/\/))(?=[^\w#]|$)/gim;
const mentionPattern = /(?:^|[^\w@#$])(@\w+(?!:\/\/))(?=[^\w@]|$)/gim;
const cashatgPattern =
    /(?:^|[^\w@#$])(\$[a-zA-Z]{1,6}(?:_[a-zA-Z]{1,2})?)(?=[\W_]|$)/gim;

function patternFromString(str: string): RegExp {
    return new RegExp(str, "gim");
}

function initPattern() {
    return new Promise<RegExp>((resolve, reject) => {
        fetch("https://data.iana.org/TLD/tlds-alpha-by-domain.txt")
            .then((response) => response.text())
            .then((data) => {
                let mainTld = data
                    .split("\n")
                    .slice(1)
                    .filter((d) => !d.includes("--"))
                    .join("|");
                mainTld = mainTld.slice(0, mainTld.length - 1);

                let secTld = data
                    .split("\n")
                    .slice(1)
                    .filter((d) => d.includes("--"))
                    .join("|");
                secTld = secTld.slice(0, secTld.length - 1);

                const urlPattern = new RegExp(
                    /(?:^|[^\w@\-#$/\.])/.source +
                        "(" +
                        /(?:https?:\/\/)?(?:(?:[^\W_]+|[^\W_][a-zA-Z0-9\-]*[^\W_])+\.)+/
                            .source +
                        `(?:(?:(?:${mainTld})` +
                        /(?![@\-+])/.source +
                        `)|(?:(?:${secTld})` +
                        /-*/.source +
                        "))" +
                        /(?:\/(?:[\w\-#=+\/]*[~!@$%&*\[\];:'\|,\.\?]+[\w\-#=+\/]+|[\w\-#=+\/]*)*)*/
                            .source +
                        ")" +
                        /(?=$|[\W_])/.source,
                    "gim"
                );

                const highlightPattern = new RegExp(
                    `${urlPattern.source}|${hashatgPattern.source}|${mentionPattern.source}|${cashatgPattern.source}`,
                    "gim"
                );

                resolve(highlightPattern);
            })
            .catch((error) => reject(error));
    });
}

const patterns = {
    initPattern,
    patternFromString,
};

export default patterns;
