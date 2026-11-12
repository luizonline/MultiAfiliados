const SHOPEE_HOSTS=["shopee.com.br","shope.ee","shp.ee"];
function isShopeeHost(host){return SHOPEE_HOSTS.some(domain=>host===domain||host.endsWith("."+domain))}
async function sha256(value){const bytes=new TextEncoder().encode(value);const digest=await crypto.subtle.digest("SHA-256",bytes);return [...new Uint8Array(digest)].map(x=>x.toString(16).padStart(2,"0")).join("")}
export async function onRequestPost({request,env}){try{
 const appId=String(env.SHOPEE_APP_ID||"").trim(),secret=String(env.SHOPEE_APP_SECRET||"").trim();
 if(!appId||!secret)return Response.json({error:"Integração Shopee ainda não configurada no Cloudflare. Cadastre SHOPEE_APP_ID e SHOPEE_APP_SECRET em Settings > Variables and Secrets."},{status:503});
 const body=await request.json();let target;try{target=new URL(body.url)}catch{return Response.json({error:"URL Shopee inválida."},{status:400})}
 if(target.protocol!=="https:"||!isShopeeHost(target.hostname.toLowerCase()))return Response.json({error:"Informe um link HTTPS de produto da Shopee."},{status:400});
 const query="mutation { generateShortLink(input: { originUrl: "+JSON.stringify(target.toString())+" }) { shortLink } }";
 const payload=JSON.stringify({query});
 const timestamp=Math.floor(Date.now()/1000).toString();
 const signature=await sha256(appId+timestamp+payload+secret);
 const response=await fetch("https://open-api.affiliate.shopee.com.br/graphql",{method:"POST",headers:{"Authorization":"SHA256 Credential="+appId+", Timestamp="+timestamp+", Signature="+signature,"Content-Type":"application/json","Accept":"application/json"},body:payload});
 const data=await response.json().catch(()=>({}));
 if(!response.ok||data.errors?.length){const detail=data.errors?.map(x=>x.message).filter(Boolean).join("; ");return Response.json({error:detail||"A Shopee recusou a solicitação. Confira o acesso à Open API e as credenciais."},{status:502})}
 const shortLink=data.data?.generateShortLink?.shortLink;
 if(!shortLink)return Response.json({error:"A Shopee não retornou um link de afiliado. Verifique se sua conta tem permissão para gerar links pela API."},{status:502});
 return Response.json({affiliateUrl:shortLink,platform:"Shopee"});
 }catch(error){return Response.json({error:"Não foi possível converter o link Shopee neste momento."},{status:500})}}
