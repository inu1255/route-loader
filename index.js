var fs = require("fs")
var lineReader = require('line-reader');

function getRoute(rootPath){
    return new Promise(function(resolve,reject){
        var counter = 0
        var result 
        function readLine(file_path,route){
            if(typeof route!="object")return;
            lineReader.eachLine(file_path, function(line, last) {
                if(/^\/\//.test(line)){
                    line = line.substring(2).replace(/\s/g,"")
                    var arr = line.split(":")
                    if(arr.length>1)route[arr[0]] = arr[1]
                    else route.title = arr[0]
                    if(!last)return
                }
                counter--
                if(counter<1)resolve(result)
                return false;
            });
        }
        function walk(dir,path) {
            var url = path.length>rootPath.length?"/"+dir.substring(rootPath.length,dir.length-1):"/"
            var data = {path:path,url:url,component:"",childRoutes:[]}
            dir = /\/$/.test(dir) ? dir : dir + '/';
            var files = fs.readdirSync(dir);
            files.forEach(function (item, next) {
                var info = fs.statSync(dir + item);
                if (info.isDirectory()) {
                    data.childRoutes.push(walk(dir + item + '/',item))
                } 
                else if(/\.jsx?$/.test(item)) {
                    var name = item.replace(/\.jsx?$/,"")
                    // 路由相对地址
                    var importPath = "./"+(dir+item).substring(rootPath.length)
                    var route = {component:importPath,url:"/"+(dir+name).substring(rootPath.length)}
                    // 添加 indexRoute
                    if(name=="index")data.indexRoute = route
                    // 添加 childRoutes
                    else {
                        route.path = name
                        data.childRoutes.push(route)
                    }
                    counter++
                    // 添加 Route属性
                    readLine(dir+item,route)
                }
            })
            return data
        }
        result = walk(rootPath,"/")
    })
}

module.exports = function(source, map) {
    this.cacheable();
    var callback = this.async();
    getRoute("src/views/").then((data)=>{
        source = "module.exports = " + JSON.stringify(data, undefined, "\t") + ";";
        callback(null, source, map);
    })
};
