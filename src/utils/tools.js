/**
 * @description Resolve the path of the files
 */

const resolveFiles = (el) => {
    return el.files[0]?.path;
}

module.exports = {
    resolveFiles
}