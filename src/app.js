const KEY="multiAfiliados.products.v1",CLICKS="multiAfiliados.clicks.v1";
const $=s=>document.querySelector(s),money=v=>Number(v||0).toLocaleString("pt-BR",{style:"currency",currency:"BRL"});
let products=readProducts(),clicks=Number(localStorage.getItem(CLICKS)||0),toastTimer,user=null,supabase=null,syncing=false;
function readProducts(){try{return JSON.parse(localStorage.getItem(KEY)||"[]")}catch{return []}}
function saveLocal(){localStorage.setItem(KEY,JSON.stringify(products));localStorage.setItem(CLICKS,String(clicks))}
function esc(v=""){return String(v).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))}
function notify(m){const t=$("#toast");t.textContent=m;t.classList.add("show");clearTimeout(toastTimer);toastTimer=setTimeout(()=>t.classList.remove("show"),3000)}
function authMessage(m){$("#authMessage").textContent=m}
function showAuth(show){$("#authScreen").classList.toggle("hidden",!show);$(".app-shell").classList.toggle("hidden",show)}
function navigate(view){document.querySelectorAll(".view").forEach(x=>x.classList.toggle("hidden",x.id!==view));document.querySelectorAll(".nav-item").forEach(x=>x.classList.toggle("active",x.hash==="#"+view));$("#pageTitle").textContent=({dashboard:"Visão geral",products:"Produtos",publish:"Publicação",settings:"Configurações"})[view]||"MultiAfiliados";history.replaceState(null,"","#"+view)}
function nextCode(){return products.reduce((m,p)=>Math.max(m,Number(p.code)||1000),1000)+1}
function message(p){return `🔥 ACHADINHO #${p.code}\n\n🛍️ ${p.name}\n${p.price?"💰 "+money(p.price)+"\n":""}${p.description?p.description+"\n\n":"\n"}👉 Confira aqui: ${p.url}`}
function preview(){const p=products.find(x=>x.id===$("#publishProduct").value);$("#publishPreview").textContent=p?message(p):"Selecione um produto para visualizar a mensagem." ;$("#shareWhatsApp").disabled=!p}
function card(p){const img=p.image?'<img src="'+esc(p.image)+'" alt="" loading="lazy" onerror="this.remove()">':"";return `<article class="product-card">${img}<div class="product-body"><div class="product-meta"><span>#${p.code}</span><span>${esc(p.platform)}</span></div><h3>${esc(p.name)}</h3><p>${esc(p.description||"Sem descrição.")}</p><div class="price">${p.price?money(p.price):"Preço não informado"}</div><div class="card-actions"><button class="btn btn-ghost" data-publish="${p.id}">Divulgar</button><button class="btn btn-ghost" data-delete="${p.id}">Excluir</button></div></div></article>`}
function render(){
 $("#statProducts").textContent=products.length;$("#statMl").textContent=products.filter(p=>p.platform==="Mercado Livre").length;$("#statShopee").textContent=products.filter(p=>p.platform==="Shopee").length;$("#statClicks").textContent=clicks;
 const recent=[...products].slice(-4).reverse();$("#recentProducts").innerHTML=recent.length?recent.map(p=>`<div class="product-meta"><strong>#${p.code} · ${esc(p.name)}</strong><span>${esc(p.platform)}</span></div>`).join(""):'<div class="empty-state">Nenhum produto cadastrado ainda. Adicione seu primeiro achadinho.</div>';
 const q=$("#searchInput").value.toLowerCase(),plat=$("#platformFilter").value,found=products.filter(p=>(!plat||p.platform===plat)&&(`#${p.code} ${p.name} ${p.description}`.toLowerCase().includes(q)));
 $("#productGrid").innerHTML=found.length?found.slice().reverse().map(card).join(""):'<div class="empty-state">Nenhum produto encontrado.</div>';
 $("#publishProduct").innerHTML='<option value="">Escolha no catálogo</option>'+products.map(p=>`<option value="${p.id}">#${p.code} · ${esc(p.name)}</option>`).join("");preview()
}
function openDialog(){$("#productDialog").showModal()}
function toRow(p){return {id:p.id,user_id:user.id,code:p.code,name:p.name,platform:p.platform,price:p.price||0,description:p.description||"",affiliate_url:p.url,image_url:p.image||"",created_at:p.createdAt||new Date().toISOString()}}
function fromRow(r){return {id:r.id,code:r.code,name:r.name,platform:r.platform,price:Number(r.price)||0,description:r.description||"",url:r.affiliate_url,image:r.image_url||"",createdAt:r.created_at}}
async function syncProducts(){
 if(!supabase||!user||syncing)return;syncing=true;
 try{
  const {data:rows,error}=await supabase.from("products").select("*").order("created_at",{ascending:true});
  if(error)throw error;
  if(rows.length){products=rows.map(fromRow);saveLocal()}
  else if(products.length){const payload=products.map(toRow);const {error:upErr}=await supabase.from("products").upsert(payload,{onConflict:"id"});if(upErr)throw upErr}
  const {count,error:countErr}=await supabase.from("product_clicks").select("*",{count:"exact",head:true});if(!countErr&&count!==null)clicks=count;
  saveLocal();render();notify("Catálogo sincronizado com a nuvem.");
 }catch(e){console.error(e);notify("Não foi possível sincronizar: "+(e.message||"verifique a configuração do Supabase."))}
 finally{syncing=false}
}
async function saveProductCloud(p){
 if(!supabase||!user)return;const {error}=await supabase.from("products").upsert(toRow(p),{onConflict:"id"});if(error)throw error
}
async function deleteProductCloud(id){if(!supabase||!user)return;const {error}=await supabase.from("products").delete().eq("id",id);if(error)throw error}
async function signIn(email,password){const {error}=await supabase.auth.signInWithPassword({email,password});if(error)throw error}
async function signUp(email,password){const {data,error}=await supabase.auth.signUp({email,password});if(error)throw error;if(!data.session)authMessage("Conta criada. Confira seu e-mail para confirmar o cadastro e depois entre no sistema.");}
function setUser(next){
 user=next;
 if(!user){showAuth(true);$("#accountEmail").textContent="";return}
 $("#accountEmail").textContent=user.email||"Conta conectada";showAuth(false);syncProducts();
}
async function init(){
 const cfg=window.MULTIAFILIADOS_SUPABASE;
 if(!window.supabase||!cfg?.url||!cfg?.publishableKey){showAuth(true);authMessage("Configuração do Supabase não carregou. Atualize a página.");return}
 supabase=window.supabase.createClient(cfg.url,cfg.publishableKey);
 const {data:{session}}=await supabase.auth.getSession();setUser(session?.user||null);
 supabase.auth.onAuthStateChange((_event,session)=>setUser(session?.user||null));
}
$("#authForm").addEventListener("submit",async e=>{e.preventDefault();const email=$("#authEmail").value.trim(),password=$("#authPassword").value;$("#loginBtn").disabled=true;try{await signIn(email,password);authMessage("Login realizado.")}catch(err){authMessage(err.message||"Não foi possível entrar.")}finally{$("#loginBtn").disabled=false}});
$("#signupBtn").addEventListener("click",async()=>{const email=$("#authEmail").value.trim(),password=$("#authPassword").value;if(!email||password.length<6){authMessage("Informe um e-mail válido e uma senha com pelo menos 6 caracteres.");return}$("#signupBtn").disabled=true;try{await signUp(email,password)}catch(err){authMessage(err.message||"Não foi possível criar a conta.")}finally{$("#signupBtn").disabled=false}});
$("#logoutBtn").addEventListener("click",async()=>{const {error}=await supabase.auth.signOut();if(error)notify(error.message);else notify("Você saiu da conta.")});
$("#newProductBtn").addEventListener("click",openDialog);$("#closeDialog").addEventListener("click",()=>$("#productDialog").close());$("#cancelDialog").addEventListener("click",()=>$("#productDialog").close());
$("#productForm").addEventListener("submit",async e=>{e.preventDefault();const f=new FormData(e.currentTarget),p={id:crypto.randomUUID(),code:nextCode(),name:f.get("name").trim(),platform:f.get("platform"),price:Number(f.get("price"))||0,description:f.get("description").trim(),url:f.get("url").trim(),image:f.get("image").trim(),createdAt:new Date().toISOString()};if(!/^https?:\/\//i.test(p.url)){notify("Informe um link válido.");return}try{await saveProductCloud(p);products.push(p);saveLocal();render();e.currentTarget.reset();$("#productDialog").close();notify("Produto salvo na nuvem.");navigate("products")}catch(err){notify("Falha ao salvar no banco: "+err.message)}});
$("#productGrid").addEventListener("click",async e=>{const b=e.target.closest("[data-publish]");if(b){navigate("publish");$("#publishProduct").value=b.dataset.publish;preview();return}const d=e.target.closest("[data-delete]");if(d&&confirm("Excluir este produto?")){try{await deleteProductCloud(d.dataset.delete);products=products.filter(p=>p.id!==d.dataset.delete);saveLocal();render();notify("Produto excluído.")}catch(err){notify("Falha ao excluir: "+err.message)}}});
$("#searchInput").addEventListener("input",render);$("#platformFilter").addEventListener("change",render);$("#publishProduct").addEventListener("change",preview);
$("#shareWhatsApp").addEventListener("click",async()=>{const p=products.find(x=>x.id===$("#publishProduct").value);if(!p)return;try{const {error}=await supabase.from("product_clicks").insert({user_id:user.id,product_id:p.id,source:"whatsapp_share"});if(error)throw error;clicks++;saveLocal();render()}catch(err){console.warn("Click tracking:",err.message)}window.open("https://wa.me/?text="+encodeURIComponent(message(p)),"_blank","noopener");notify("Mensagem preparada no WhatsApp.")});
$("#exportBtn").addEventListener("click",()=>{const blob=new Blob([JSON.stringify({version:1,exportedAt:new Date().toISOString(),products,clicks},null,2)],{type:"application/json"}),a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download="multi-afiliados-backup.json";a.click();URL.revokeObjectURL(a.href)});
$("#importInput").addEventListener("change",async e=>{const file=e.target.files[0];if(!file)return;try{const data=JSON.parse(await file.text());if(!Array.isArray(data.products)||!data.products.every(p=>p.name&&p.url))throw Error("Arquivo inválido");if(!confirm("Mesclar os produtos do backup com o catálogo da nuvem?"))return;for(const p of data.products){if(!p.id||! /^[0-9a-f-]{36}$/i.test(p.id))p.id=crypto.randomUUID();const existing=products.find(x=>x.id===p.id);if(existing)Object.assign(existing,p);else products.push(p);await saveProductCloud(p)}saveLocal();render();notify("Backup importado e sincronizado.")}catch(err){notify("Falha na importação: "+err.message)}finally{e.target.value=""}});
document.querySelectorAll("[data-go]").forEach(b=>b.addEventListener("click",()=>navigate(b.dataset.go)));document.querySelectorAll(".nav-item").forEach(a=>a.addEventListener("click",e=>{e.preventDefault();navigate(a.hash.slice(1))}));
render();init();
