const KEY="multiAfiliados.products.v1",CLICKS="multiAfiliados.clicks.v1";
const $=s=>document.querySelector(s),money=v=>Number(v||0).toLocaleString("pt-BR",{style:"currency",currency:"BRL"}),parsePrice=v=>{const s=String(v??"").trim().replace(/R\$\s*/i,"").replace(/\s/g,"");if(!s)return 0;const normalized=s.includes(",")?s.replace(/\./g,"").replace(",","."):s;const n=Number(normalized);return Number.isFinite(n)?n:0},formatPriceInput=v=>v===null||v===undefined||v===""?"":Number(v).toLocaleString("pt-BR",{minimumFractionDigits:2,maximumFractionDigits:2});
let products=readProducts(),clicks=Number(localStorage.getItem(CLICKS)||0),toastTimer,user=null,supabaseClient=null,syncing=false;
function readProducts(){try{return JSON.parse(localStorage.getItem(KEY)||"[]")}catch{return []}}
function saveLocal(){localStorage.setItem(KEY,JSON.stringify(products));localStorage.setItem(CLICKS,String(clicks))}
function esc(v=""){return String(v).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))}
function notify(m){const t=$("#toast");t.textContent=m;t.classList.add("show");clearTimeout(toastTimer);toastTimer=setTimeout(()=>t.classList.remove("show"),3000)}
function authMessage(m){$("#authMessage").textContent=m}
function showAuth(show){const auth=$("#authScreen"),app=$(".app-shell");auth.classList.toggle("hidden",!show);app.classList.toggle("hidden",show);auth.style.display=show?"grid":"none";app.style.display=show?"none":"grid"}
function navigate(view){document.querySelectorAll(".view").forEach(x=>x.classList.toggle("hidden",x.id!==view));document.querySelectorAll(".nav-item").forEach(x=>x.classList.toggle("active",x.hash==="#"+view));$("#pageTitle").textContent=({dashboard:"Visão geral",products:"Produtos",publish:"Publicação",settings:"Configurações"})[view]||"MultiAfiliados";history.replaceState(null,"","#"+view)}
function nextCode(){return products.reduce((m,p)=>Math.max(m,Number(p.code)||1000),1000)+1}
function message(p){const promo=Number(p.originalPrice)>Number(p.price)&&Number(p.price)>0?`🔥 DE ~${money(p.originalPrice)}~ | POR ${money(p.price)}\n\n`:p.price?`💰 ${money(p.price)}\n\n`:"";return `🛍️ ${p.name}\n\n${promo}🟡 OFERTA no ${p.platform} 👇\n${p.url}`}
function preview(){const p=products.find(x=>x.id===$("#publishProduct").value);$("#publishPreview").textContent=p?message(p):"Selecione um produto para visualizar a mensagem." ;$("#shareWhatsApp").disabled=!p}
function card(p){const img=p.image?'<img src="'+esc(p.image)+'" alt="" loading="lazy" onerror="this.remove()">':"";const price=Number(p.originalPrice)>Number(p.price)?`<div class="price"><del>${money(p.originalPrice)}</del> <strong>${money(p.price)}</strong></div>`:`<div class="price">${p.price?money(p.price):"Preço não informado"}</div>`;return `<article class="product-card">${img}<div class="product-body"><div class="product-meta"><span>#${p.code}</span><span>${esc(p.platform)}</span></div><h3>${esc(p.name)}</h3><p>${esc(p.description||"Sem descrição.")}</p>${price}<div class="card-actions"><button class="btn btn-ghost" data-publish="${p.id}">Divulgar</button><button class="btn btn-ghost" data-delete="${p.id}">Excluir</button></div></div></article>`}
function render(){
 $("#statProducts").textContent=products.length;$("#statMl").textContent=products.filter(p=>p.platform==="Mercado Livre").length;$("#statShopee").textContent=products.filter(p=>p.platform==="Shopee").length;$("#statClicks").textContent=clicks;
 const recent=[...products].slice(-4).reverse();$("#recentProducts").innerHTML=recent.length?recent.map(p=>`<div class="product-meta"><strong>#${p.code} · ${esc(p.name)}</strong><span>${esc(p.platform)}</span></div>`).join(""):'<div class="empty-state">Nenhum produto cadastrado ainda. Adicione seu primeiro achadinho.</div>';
 const q=$("#searchInput").value.toLowerCase(),plat=$("#platformFilter").value,found=products.filter(p=>(!plat||p.platform===plat)&&(`#${p.code} ${p.name} ${p.description}`.toLowerCase().includes(q)));
 $("#productGrid").innerHTML=found.length?found.slice().reverse().map(card).join(""):'<div class="empty-state">Nenhum produto encontrado.</div>';
 $("#publishProduct").innerHTML='<option value="">Escolha no catálogo</option>'+products.map(p=>`<option value="${p.id}">#${p.code} · ${esc(p.name)}</option>`).join("");preview()
}
function openDialog(){$("#productDialog").showModal()}
function toRow(p){return {id:p.id,user_id:user.id,code:p.code,name:p.name,platform:p.platform,price:p.price||0,original_price:p.originalPrice||null,description:p.description||"",affiliate_url:p.url,image_url:p.image||"",created_at:p.createdAt||new Date().toISOString()}}
function fromRow(r){return {id:r.id,code:r.code,name:r.name,platform:r.platform,price:Number(r.price)||0,originalPrice:Number(r.original_price)||0,description:r.description||"",url:r.affiliate_url,image:r.image_url||"",createdAt:r.created_at}}
async function syncProducts(){
 if(!supabaseClient||!user||syncing)return;syncing=true;
 try{
  const {data:rows,error}=await supabaseClient.from("products").select("*").order("created_at",{ascending:true});
  if(error)throw error;
  if(rows.length){products=rows.map(fromRow);saveLocal()}
  else if(products.length){const payload=products.map(toRow);const {error:upErr}=await supabaseClient.from("products").upsert(payload,{onConflict:"id"});if(upErr)throw upErr}
  const {count,error:countErr}=await supabaseClient.from("product_clicks").select("*",{count:"exact",head:true});if(!countErr&&count!==null)clicks=count;
  saveLocal();render();notify("Catálogo sincronizado com a nuvem.");
 }catch(e){console.error(e);notify("Não foi possível sincronizar: "+(e.message||"verifique a configuração do Supabase."))}
 finally{syncing=false}
}
async function saveProductCloud(p){
 if(!supabaseClient||!user)return;const {error}=await supabaseClient.from("products").upsert(toRow(p),{onConflict:"id"});if(error)throw error
}
async function deleteProductCloud(id){if(!supabaseClient||!user)return;const {error}=await supabaseClient.from("products").delete().eq("id",id);if(error)throw error}
async function signIn(email,password){const {error}=await supabaseClient.auth.signInWithPassword({email,password});if(error)throw error}
async function signUp(email,password){
 if(!supabaseClient)throw new Error("A conexão com o Supabase não foi iniciada. Atualize a página.");
 const {data,error}=await supabaseClient.auth.signUp({email,password,options:{emailRedirectTo:window.location.origin}});
 if(error)throw error;
 return data;
}
function setUser(next){
 user=next;
 if(!user){showAuth(true);$("#accountEmail").textContent="";return}
 $("#accountEmail").textContent=user.email||"Conta conectada";showAuth(false);syncProducts();
}
async function init(){
 const cfg=window.MULTIAFILIADOS_SUPABASE;
 if(!window.supabase||!cfg?.url||!cfg?.publishableKey){showAuth(true);authMessage("Configuração do Supabase não carregou. Atualize a página.");return}
 supabaseClient=window.supabase.createClient(cfg.url,cfg.publishableKey);
 const {data:{session}}=await supabaseClient.auth.getSession();setUser(session?.user||null);
 supabaseClient.auth.onAuthStateChange((_event,session)=>setUser(session?.user||null));
}
$("#authForm").addEventListener("submit",async e=>{e.preventDefault();const email=$("#authEmail").value.trim(),password=$("#authPassword").value;$("#loginBtn").disabled=true;try{await signIn(email,password);authMessage("Login realizado.")}catch(err){authMessage(err.message||"Não foi possível entrar.")}finally{$("#loginBtn").disabled=false}});
$("#signupBtn").addEventListener("click",async()=>{
 const email=$("#authEmail").value.trim().toLowerCase(),password=$("#authPassword").value;
 if(!email||!$("#authEmail").checkValidity()){authMessage("Digite um endereço de e-mail válido.");$("#authEmail").focus();return}
 if(password.length<6){authMessage("A senha precisa ter pelo menos 6 caracteres.");$("#authPassword").focus();return}
 if(!supabaseClient){authMessage("O sistema ainda está conectando ao banco. Atualize a página e tente novamente.");return}
 $("#signupBtn").disabled=true;$("#loginBtn").disabled=true;
 authMessage("Enviando solicitação de cadastro...");
 try{
  const data=await signUp(email,password);
  if(data.session){setUser(data.session.user);authMessage("Conta criada e acesso liberado.")}
  else{authMessage("Solicitação enviada. Verifique a caixa de entrada e o spam do e-mail para confirmar a conta. Depois volte e clique em Entrar.")}
 }catch(err){
  console.error("Erro ao criar conta:",err);
  const msg=err?.message||"Falha desconhecida ao criar a conta.";
  authMessage("Não foi possível criar a conta: "+msg);
 }finally{$("#signupBtn").disabled=false;$("#loginBtn").disabled=false}
});
$("#logoutBtn").addEventListener("click",async()=>{const {error}=await supabaseClient.auth.signOut();if(error)notify(error.message);else notify("Você saiu da conta.")});
$("#newProductBtn").addEventListener("click",openDialog);$("#closeDialog").addEventListener("click",()=>$("#productDialog").close());$("#cancelDialog").addEventListener("click",()=>$("#productDialog").close());
$("#importProductBtn").addEventListener("click",async()=>{
 const input=$("#importProductUrl"),status=$("#importProductStatus"),button=$("#importProductBtn"),url=input.value.trim();
 if(!url){status.textContent="Cole primeiro o link do produto.";input.focus();return}
 let parsed;try{parsed=new URL(url)}catch{status.textContent="O link informado não é válido.";return}
 if(!["http:","https:"].includes(parsed.protocol)){status.textContent="Use um link HTTPS válido.";return}
 const formBeforeRequest=$("#productForm");const detectedPlatform=/shopee\\.com\\.br|shope\\.ee/i.test(parsed.hostname)?"Shopee":"Mercado Livre";formBeforeRequest.elements.platform.value=detectedPlatform;button.disabled=true;status.textContent="Consultando as informações do produto...";
 try{
  const response=await fetch("/api/import-product",{method:"POST",headers:{"Content-Type":"application/json","Accept":"application/json"},body:JSON.stringify({url})});
  const responseText=await response.text();
  let result={};
  try{result=responseText?JSON.parse(responseText):{}}
  catch{throw new Error("O servidor retornou uma resposta inválida (HTTP "+response.status+"). Verifique se a função /api/import-product está publicada no Cloudflare Pages.")}
  if(!response.ok)throw new Error(result.error||"Falha na consulta (HTTP "+response.status+").");
  if(!result||typeof result!=="object")throw new Error("A resposta do servidor veio em formato inesperado.");
  const form=$("#productForm");
  if(result.name)form.elements.name.value=result.name;
  if(result.platform)form.elements.platform.value=result.platform;
  if(result.price!==null&&result.price!==undefined)form.elements.price.value=formatPriceInput(result.price);if(result.originalPrice!==null&&result.originalPrice!==undefined)form.elements.originalPrice.value=formatPriceInput(result.originalPrice);
  if(result.description)form.elements.description.value=result.description;
  if(result.image)form.elements.image.value=result.image;
  let affiliateUrl=result.affiliateUrl||url;
  if(result.platform==="Shopee"&&!result.affiliateUrl){
   status.textContent="Dados encontrados. Gerando seu link de afiliado Shopee...";
   try{
    const linkResponse=await fetch("/api/shopee-link",{method:"POST",headers:{"Content-Type":"application/json","Accept":"application/json"},body:JSON.stringify({url:result.canonicalUrl||url})});
    const linkData=await linkResponse.json().catch(()=>({}));
    if(!linkResponse.ok)throw new Error(linkData.error||"Falha ao gerar link de afiliado.");
    affiliateUrl=linkData.affiliateUrl;
   }catch(linkError){form.elements.url.value=url;status.textContent="Dados do produto encontrados, mas não foi possível gerar o link de afiliado: "+linkError.message+" O link original foi mantido.";return}
  }
  form.elements.url.value=affiliateUrl;
  const fields=[result.name,result.price!==null&&result.price!==undefined,result.image].filter(Boolean).length;
  status.textContent=result.platform==="Shopee"?"Informações encontradas e link de afiliado Shopee gerado. Confira os campos antes de salvar.":fields?"Informações encontradas. Confira os campos e complete o que estiver faltando antes de salvar.":"O link foi reconhecido, mas a loja não disponibilizou os dados automaticamente. Você pode preencher os campos manualmente.";
 }catch(error){console.error("Importação do produto:",error);status.textContent=error.message+" Você ainda pode preencher os dados manualmente."}
 finally{button.disabled=false}
});
$("#productForm").addEventListener("submit",async e=>{e.preventDefault();const f=new FormData(e.currentTarget),p={id:crypto.randomUUID(),code:nextCode(),name:f.get("name").trim(),platform:f.get("platform"),price:parsePrice(f.get("price")),originalPrice:parsePrice(f.get("originalPrice")),description:f.get("description").trim(),url:f.get("url").trim(),image:f.get("image").trim(),createdAt:new Date().toISOString()};if(!/^https?:\/\//i.test(p.url)){notify("Informe um link válido.");return}try{await saveProductCloud(p);products.push(p);saveLocal();render();e.currentTarget.reset();$("#productDialog").close();notify("Produto salvo na nuvem.");navigate("products")}catch(err){notify("Falha ao salvar no banco: "+err.message)}});
$("#productGrid").addEventListener("click",async e=>{const b=e.target.closest("[data-publish]");if(b){navigate("publish");$("#publishProduct").value=b.dataset.publish;preview();return}const d=e.target.closest("[data-delete]");if(d&&confirm("Excluir este produto?")){try{await deleteProductCloud(d.dataset.delete);products=products.filter(p=>p.id!==d.dataset.delete);saveLocal();render();notify("Produto excluído.")}catch(err){notify("Falha ao excluir: "+err.message)}}});
$("#searchInput").addEventListener("input",render);$("#platformFilter").addEventListener("change",render);$("#publishProduct").addEventListener("change",preview);
$("#shareWhatsApp").addEventListener("click",async()=>{const p=products.find(x=>x.id===$("#publishProduct").value);if(!p)return;try{const {error}=await supabaseClient.from("product_clicks").insert({user_id:user.id,product_id:p.id,source:"whatsapp_share"});if(error)throw error;clicks++;saveLocal();render()}catch(err){console.warn("Click tracking:",err.message)}window.open("https://wa.me/?text="+encodeURIComponent(message(p)),"_blank","noopener");notify("Mensagem preparada no WhatsApp.")});
$("#exportBtn").addEventListener("click",()=>{const blob=new Blob([JSON.stringify({version:1,exportedAt:new Date().toISOString(),products,clicks},null,2)],{type:"application/json"}),a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download="multi-afiliados-backup.json";a.click();URL.revokeObjectURL(a.href)});
$("#importInput").addEventListener("change",async e=>{const file=e.target.files[0];if(!file)return;try{const data=JSON.parse(await file.text());if(!Array.isArray(data.products)||!data.products.every(p=>p.name&&p.url))throw Error("Arquivo inválido");if(!confirm("Mesclar os produtos do backup com o catálogo da nuvem?"))return;for(const p of data.products){if(!p.id||! /^[0-9a-f-]{36}$/i.test(p.id))p.id=crypto.randomUUID();const existing=products.find(x=>x.id===p.id);if(existing)Object.assign(existing,p);else products.push(p);await saveProductCloud(p)}saveLocal();render();notify("Backup importado e sincronizado.")}catch(err){notify("Falha na importação: "+err.message)}finally{e.target.value=""}});
document.querySelectorAll("[data-go]").forEach(b=>b.addEventListener("click",()=>navigate(b.dataset.go)));document.querySelectorAll(".nav-item").forEach(a=>a.addEventListener("click",e=>{e.preventDefault();navigate(a.hash.slice(1))}));
render();init();
