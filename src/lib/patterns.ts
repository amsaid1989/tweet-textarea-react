/**
 * The MIT License (MIT)
 *
 * Copyright © 2022 Abdelrahman Said
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of this software
 * and associated documentation files (the “Software”), to deal in the Software without restriction,
 * including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense,
 * and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so,
 * subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all copies or substantial
 * portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED “AS IS”, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT
 * LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
 * IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
 * WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE
 * OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */

const hashatgPattern = /(?:^|\W)(#\w*[a-zA-Z]+\w*(?!:\/\/))(?=[^\w#]|$)/gim;
const mentionPattern = /(?:^|[^\w@#$])(@\w+(?!:\/\/))(?=[^\w@]|$)/gim;
const cashatgPattern =
    /(?:^|[^\w@#$])(\$[a-zA-Z]{1,6}(?:_[a-zA-Z]{1,2})?)(?=[\W_]|$)/gim;

function patternFromString(str: string): RegExp {
    return new RegExp(str, "gim");
}

function initPattern() {
    /**
     * Retrieves the list of the top-level domains and uses it to construct
     * the regex pattern that is used for the formatting. It returns the pattern
     * in a promise that resolves once fetching the domains list is complete.
     */
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
                        /(?:https?:\/\/)?(?:www\.)?(?:(?:[^\W_][a-zA-Z0-9\-]*[^\W_])+\.)+/
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
