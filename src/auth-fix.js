// Fallback isolado para o cadastro: mantém o botão funcional mesmo se outro módulo falhar.
(function () {
  const ready = () => {
    // Delegação no documento: evita conflito com o submit do formulário.
    document.addEventListener("click", async function (event) {
      const loginButton = event.target.closest("#loginBtn");
      if (!loginButton || loginButton.dataset.busy === "1") return;
      event.preventDefault();
      event.stopPropagation();
      const emailInput = document.getElementById("authEmail");
      const passwordInput = document.getElementById("authPassword");
      const message = document.getElementById("authMessage");
      const say = (value) => { if (message) message.textContent = value; };
      const email = (emailInput?.value || "").trim().toLowerCase();
      const password = passwordInput?.value || "";
      if (!emailInput?.checkValidity()) { say("Digite um e-mail válido."); emailInput?.focus(); return; }
      if (password.length < 6) { say("A senha precisa ter pelo menos 6 caracteres."); passwordInput?.focus(); return; }
      const cfg = window.MULTIAFILIADOS_SUPABASE;
      const sdk = window.supabase;
      if (!cfg?.url || !cfg?.publishableKey || !sdk?.createClient) {
        say("Não foi possível carregar o Supabase. Atualize a página e tente novamente.");
        return;
      }
      loginButton.dataset.busy = "1";
      loginButton.disabled = true;
      say("Tentando entrar no sistema...");
      try {
        const client = sdk.createClient(cfg.url, cfg.publishableKey);
        const { data, error } = await client.auth.signInWithPassword({ email, password });
        if (error) throw error;
        if (!data?.session) throw new Error("O Supabase não retornou uma sessão.");
        say("Login realizado. Carregando o painel...");
        window.location.reload();
      } catch (error) {
        console.error("Erro de login:", error);
        const msg = error?.message || "Erro desconhecido";
        say(msg === "Invalid login credentials"
          ? "E-mail ou senha incorretos. Se esta conta foi criada antes de desativar a confirmação, confirme o usuário em Authentication > Users."
          : "Não foi possível entrar: " + msg);
      } finally {
        loginButton.disabled = false;
        delete loginButton.dataset.busy;
      }
    }, true);
    const button = document.getElementById("signupBtn");
    const emailInput = document.getElementById("authEmail");
    const passwordInput = document.getElementById("authPassword");
    const message = document.getElementById("authMessage");
    if (!button || button.dataset.fallbackBound === "1") return;
    button.dataset.fallbackBound = "1";
    button.addEventListener("click", async function (event) {
      event.preventDefault();
      event.stopImmediatePropagation();
      const email = (emailInput?.value || "").trim().toLowerCase();
      const password = passwordInput?.value || "";
      const say = (text) => { if (message) message.textContent = text; };
      if (!emailInput || !emailInput.checkValidity()) { say("Digite um endereço de e-mail válido."); emailInput?.focus(); return; }
      if (password.length < 6) { say("A senha precisa ter pelo menos 6 caracteres."); passwordInput?.focus(); return; }
      const cfg = window.MULTIAFILIADOS_SUPABASE;
      const client = window.supabase;
      if (!cfg?.url || !cfg?.publishableKey || !client?.createClient) {
        say("Não foi possível carregar a conexão com o banco. Atualize a página (Ctrl+F5) e tente novamente.");
        return;
      }
      button.disabled = true;
      say("Conectando ao banco e criando sua conta...");
      try {
        const sb = client.createClient(cfg.url, cfg.publishableKey);
        const { data, error } = await sb.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin }
        });
        if (error) throw error;
        say(data.session
          ? "Conta criada com sucesso. Você já pode entrar."
          : "Solicitação enviada. Confira seu e-mail e a pasta de spam para confirmar a conta. Depois volte e clique em Entrar.");
      } catch (error) {
        console.error("Falha no cadastro MultiAfiliados:", error);
        say("Erro no cadastro: " + (error?.message || "não foi possível concluir a solicitação."));
      } finally {
        button.disabled = false;
      }
    }, true);
    window.addEventListener("error", function (e) {
      console.error("Erro JavaScript MultiAfiliados:", e.message, e.filename, e.lineno);
    });
  };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", ready);
  else ready();
})();