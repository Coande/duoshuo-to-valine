const fs = require('fs');
const JSONbig = require('json-bigint');

const INPUTFILE = 'data/duoshuo-raw.json';
const OUTPUTFILE = 'data/duoshuo-valine.json';
const OUTPUTLOST = 'data/duoshuo-lost.json';

// 同步读取
const data = fs.readFileSync(INPUTFILE);

const jsonData = JSONbig.parse(data);

// 排序
jsonData.posts.sort((a, b) => {
	return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
});

// 获取最后一条评论
const obj = jsonData.posts[jsonData.posts.length - 1];
console.log("最后一条评论时间：", new Date(obj.created_at));

// 存放 valine 格式对象
const jsonResult = [];

// 存放找不到 thread 的 post 对象
const postOfLostThread = [];

function getAtMan(pid) {
  if (!pid) {
    return;
  }
  let atMan;
  jsonData.posts.forEach(post => {
    if (post.post_id.toString() == pid) {
      const nickname = post.author_name;
      const comment_id = post.post_id.toString();
      atMan = `<a class="at" href="#${comment_id}">@${nickname} </a> , `;
    }
  });
  return atMan;
}

jsonData.posts.forEach(item => {
  // 根据 thread_id 找 thread，从而得到 url，根据 url 得到 pathname
  const foundThread = jsonData.threads.find(
    thread => thread.thread_id.toString() === item.thread_id.toString()
  );
  if (!foundThread) {
    // 有可能脏数据，找不到 thread
    postOfLostThread.push(item);
    return;
  }
  const pathname = decodeURIComponent(new URL(foundThread.url).pathname);
  const pid = item.parents && item.parents.length
    ? item.parents[item.parents.length - 1].toString()
    : undefined;
  const atMan = getAtMan(pid);
  const comment = atMan ? atMan + item.message : item.message;

  // 构造 valine 格式
  jsonResult.push({
    objectId: item.post_id.toString(),
    nick: item.author_name,
    ACL: {
      '*': {
        read: true
      }
    },
    mail: item.author_email,
    insertedAt: {
      __type: 'Date',
      iso: new Date(item.created_at).toISOString()
    },
    pid,
    link: item.author_url,
    comment,
    url: pathname,
    rid:
      item.parents && item.parents.length
        ? item.parents[0].toString()
        : undefined,
    createdAt: {
      __type: 'Date',
      iso: new Date(item.created_at).toISOString()
    },
    updatedAt: {
      __type: 'Date',
      iso: new Date(item.updated_at).toISOString()
    }
  });
});

fs.writeFileSync(OUTPUTFILE, JSON.stringify(jsonResult, null, 2));
console.log('转换后的文件已输出到：', OUTPUTFILE)

if (postOfLostThread.length) {
  fs.writeFileSync(
    OUTPUTLOST,
    JSON.stringify({
      threads: jsonData.threads,
      posts: postOfLostThread
    }, null, 2)
  );
  console.log('部分评论找不到对应文章，已输出到：', OUTPUTLOST);
}
