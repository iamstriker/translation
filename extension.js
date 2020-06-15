var hx = require("hbuilderx");
const {
	youdao,
	baidu,
	google
} = require("translation.js"); //引入翻译库
const pinyin = require("chinese-to-pinyin"); //引入拼音库

function activate(context) {
	let replace = hx.commands.registerCommand('extension.translatereplace', () => {
		const dealWith = async (word, fy) => {
			const l1 = await new Promise((resolve, reject) => {
				fy.translate(word).then(result => {
					resolve(words(result.result[0]))
				})
			})
			const l2 = await new Promise((resolve, reject) => {
				resolve([{
					label: pinyin(word, {
						"removeTone": true,
						"removeSpace": true
					}),
					description: '拼音'
				}, {
					label: pinyin(word, {
						"removeTone": true,
						"removeSpace": true,
						"firstCharacter": true
					}),
					description: '拼音首字母'
				}])
			})
			return [...l1, ...l2]
		}
		const perform = (listArray,editor,selection)=>{
			const pickResult = hx.window.showQuickPick(listArray, {
				placeHolder: '选择替换'
			});
			pickResult.then(res => {
				if (!res) {
					return;
				}
				editor.edit(editBuilder=>{
					editBuilder.replace(selection,res.label)
				})
			})
		}
		let editorPromise = hx.window.getActiveTextEditor();
		editorPromise.then((editor) => {
			let selection = editor.selection;
			let word = editor.document.getText(selection);
			let config = hx.workspace.getConfiguration();
			let source = config.get("source", false);
			let fy = google;
			let listArray = []
			if (source === "baidu") {
				fy = baidu;
			} else if (source === "google") {
				fy = google;
			} else if (source === "youdao") {
				fy = youdao;
			} else {
				config.update("source", "google")
				fy = google
			}
			if (word.length > 0) {
				google.detect(word).then(lang => {
					if (lang === 'en') {
						fy.translate(word).then(result => {
							listArray = [{
								label: result.result[0],
								description: '中文翻译'
							}]
							perform(listArray,editor,selection)
						})
					} else if (['zh', 'zh-CN', 'zh-TW'].includes(lang)) {
						dealWith(word, fy).then(res => {
							perform(res,editor,selection)
						})
					} else {
						hx.window.showErrorMessage('仅支持中文和英文!');
					}
				})
			} else {
				hx.window.showErrorMessage('未选取内容!');
			}
		})
	});
	let setbaidu = hx.commands.registerCommand('extension.setbaidu', () => {
		sets("source", "baidu", "切换到百度翻译源成功!")
	});
	let setyoudao = hx.commands.registerCommand('extension.setyoudao', () => {
		sets("source", "youdao", "切换到有道翻译源成功!")
	});
	let setgoogle = hx.commands.registerCommand('extension.setgoogle', () => {
		sets("source", "google", "切换到谷歌翻译源成功!")
	});
}

function words(str) {
	strs = str.split(" ")
	if (strs.length > 1) {
		let [k1, k2, k3, k4, k5, k6, k7] = ['', '', '', '', '', '', '']
		let b = ['大驼峰', '全小写', '全大写', '小驼峰', '空格连接', '-连接', '_连接']
		strs.map((data, i) => {
			let kkk = strs[i].toLowerCase()
			k2 += kkk
			k1 += kkk.replace(kkk[0], kkk[0].toUpperCase())
			k5 = (i + 1 < strs.length) ? k5 + kkk + " " : k5 + kkk
			k6 = (i + 1 < strs.length) ? k6 + kkk + " " : k6 + kkk
			k7 = (i + 1 < strs.length) ? k7 + kkk + " " : k7 + kkk
		})
		k3 = k2.toUpperCase()
		k4 = k1.replace(k1[0], k1[0].toLowerCase())
		k6 = k6.replace(/ /g, '-')
		k7 = k7.replace(/ /g, '_')
		return [k1, k2, k3, k4, k5, k6, k7].map((data, i) => ({
			label: data,
			description: b[i]
		}))
	} else {
		let [k1, k2, k3] = ['', '', '']
		let b = ['小驼峰', '全大写', '大驼峰']
		k1 = str.toLowerCase()
		k2 = str.toUpperCase()
		k3 = k1.replace(k1[0], k1[0].toUpperCase())
		return [k1, k2, k3].map((data, i) => ({
			label: data,
			description: b[i]
		}))
	}
}

/**
 * 设置配置,给予反馈
 * @description 设置配置,给予反馈
 * @param {Number} type 
 * @param {String} data
 * @param {String} desc 文字信息 
 */
function sets(type, data, desc) {
	hx.workspace.getConfiguration().update(type, data)
		.then(() => {
			hx.window.showWarningMessage(desc)
		})
		.catch(() => {
			hx.window.showWarningMessage("设置失败!")
		});
}

// function deactivate() {

// }
module.exports = {
	activate
}
