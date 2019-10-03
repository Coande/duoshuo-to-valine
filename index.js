const fs = require('fs');
const JSONbig = require('json-bigint');

// 同步读取
const data = fs.readFileSync('data/duoshuo-raw.json');

const jsonData = JSONbig.parse(data);

// 排序
// jsonData.posts.sort((a, b) => {
// 	return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
// });

// 获取最后一条评论
// const obj = jsonData.threads[jsonData.threads.length - 1];
// console.log(new Date(obj.created_at));

// 存放 valine 格式对象
const jsonResult = [];

// 存放找不到 thread 的 post 对象
const postOfLostThread = [];

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
    pid:
      item.parents && item.parents.length
        ? item.parents[item.parents.length - 1].toString()
        : undefined,
    link: item.author_url,
    comment: item.message,
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

fs.writeFileSync('data/duoshuo-valine.json', JSON.stringify(jsonResult, null, 2));
fs.writeFileSync(
  'data/duoshuo-lost.json',
  JSON.stringify(postOfLostThread, null, 2)
);
