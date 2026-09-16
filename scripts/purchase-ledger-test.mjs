#!/usr/bin/env node
// Real Redis Lua integration; all identities and HTTP traffic are local fixtures.
import assert from 'node:assert/strict';
import {spawn, execFileSync} from 'node:child_process';
import {mkdtempSync, rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createServer} from 'node:http';
import {setTimeout as delay} from 'node:timers/promises';
import {registerPurchase, ledgerCommand} from '../api/grant/_ledger.js';
import {signGrant} from '../api/grant/_jwt.js';
import redeem from '../api/grant/redeem.js';
const dir=mkdtempSync(join(tmpdir(),'ast-ledger-')), socket=join(dir,'redis.sock');
let redis, server;
function command(...args){return JSON.parse(execFileSync('redis-cli',['-s',socket,'--json',...args],{encoding:'utf8',stdio:['ignore','pipe','ignore']}));}
async function start(){redis=spawn('redis-server',['--port','0','--unixsocket',socket,'--dir',dir,'--dbfilename','ledger.rdb','--save',''],{stdio:'ignore'});await delay(150); assert.equal(command('PING'),'PONG');}
try {
 await start();
 server=createServer(async(req,res)=>{let body='';for await(const part of req)body+=part;try {assert.equal(req.headers.authorization,'Bearer fixture');res.end(JSON.stringify({result:command(...JSON.parse(body))}));}catch {res.statusCode=500;res.end('{}');}});
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 Object.assign(process.env,{NODE_ENV:'test',GRANT_JWT_SECRET:'fixture-secret',UPSTASH_REDIS_REST_URL:`http://127.0.0.1:${server.address().port}`,UPSTASH_REDIS_REST_TOKEN:'fixture'});
 const grant={kind:'gems',amount:120,sku:'gems_s',id:null,gid:'c'.repeat(32)};
 const purchase={sale_id:'sale',seller_id:'seller',product_id:'product',purchaser_id:'buyer'};
 const identity=await registerPurchase(purchase,grant);
 assert.deepEqual(await registerPurchase(purchase,grant),identity);
 await assert.rejects(registerPurchase(purchase,{...grant,amount:240}));
 const a='a'.repeat(64), b='b'.repeat(64);
 const permanent=await registerPurchase({...purchase,sale_id:'permanent'},{...grant,kind:'pass'});
 assert.equal((await ledgerCommand('claim',permanent.transaction,permanent.owner,a)).mode,'deliver');
 assert.equal((await ledgerCommand('claim',permanent.transaction,permanent.owner,b)).mode,'restore','pending permanent benefits recover without consumable reassignment');
 const races=await Promise.all([ledgerCommand('claim',identity.transaction,identity.owner,a),ledgerCommand('claim',identity.transaction,identity.owner,b)]);
 assert.equal(races.filter(x=>x.ok).length,1,'only one device can start delivery');
 const winner=races[0].ok?a:b, other=winner===a?b:a;
 assert.equal((await ledgerCommand('claim',identity.transaction,identity.owner,winner)).mode,'deliver');
 assert.equal((await ledgerCommand('ack',identity.transaction,identity.owner,other)).ok,false);
 assert.equal((await ledgerCommand('claim',identity.transaction,'f'.repeat(64),winner)).ok,false);
 const pt=signGrant({...grant,...identity,ledger:1},process.env.GRANT_JWT_SECRET);
 async function route(body,method='POST'){let status;let data;await redeem({method,body},{setHeader(){},status(n){status=n;return this;},json(v){data=v;return this;}});return {status,data};}
 assert.equal((await route({pt,delivery_id:winner})).data.mode,'deliver');
 assert.equal((await route({pt,delivery_id:winner,action:'ack'})).status,200);
 assert.equal((await route({pt,delivery_id:other})).data.mode,'restore');
 assert.equal((await route({pt:pt+'x',delivery_id:winner})).status,400);
 assert.equal((await route({pt},'GET')).status,405);
 assert.equal((await route({pt:signGrant(grant,process.env.GRANT_JWT_SECRET),delivery_id:winner})).status,409);
 command('SAVE');const ended=new Promise(resolve=>redis.once('exit',resolve));redis.kill('SIGTERM');await ended;await start();
 assert.equal((await ledgerCommand('claim',identity.transaction,identity.owner,other)).mode,'restore','delivered state survives Redis restart');
 delete process.env.UPSTASH_REDIS_REST_TOKEN;
 assert.equal((await route({pt,delivery_id:winner})).status,503,'missing persistence fails closed');
 console.log('Purchase ledger integration passed: atomic concurrent claims, retry, acknowledgement, owner checks, token rejection, restart persistence and fail-closed configuration.');
} finally {server?.close();redis?.kill('SIGTERM');await delay(100);rmSync(dir,{recursive:true,force:true});}
