// Fallback isolado para o cadastro: mantém o botão funcional mesmo se outro módulo falhar.
(function () {
  const ready = () => {
    const loginButton = document.getElementById("loginBtn");
    const loginEmail = document.getElementById("authEmail");
    const loginPassword = document.getElementById("authPassword");
    const loginMessage = document.getElementById("authMessage");
    if (loginButton && loginButton.dataset.loginFallbackBound !== "1") {
      loginButton.dataset.loginFallbackBound = "1";
      loginButton.addEventListener("click", async function (event) {
        event.preventDefault();
        event.stopImmediatePropagation();
        const say = (value) => { if (loginMessage) loginMessage.textContent = value; };
        const email = (loginEmail?.value || "").trim().toLowerCase();
        const password = loginPassword?.value || "";
        if (!loginEmail?.checkValidity()) { say("Digite um e-mail válido."); loginEmail?.focus(); return; }
        if (password.length < 6) { say("A senha precisa ter pelo menos 6 caracteres."); loginPassword?.focus(); return; }
        const cfg = window.MULTIAFILIADOS_SUPABASE;
        const sdk = window.supabase;
        if (!cfg?.url || !cfg?.publishableKey || !sdk?.createClient) {
          say("Conexão com o Supabase indisponível. Atualize a página e tente novamente.");
          return;
        }
        loginButton.disabled = true;
        say("Verificando seus dados de acesso...");
        try {
          const client = sdk.createClient(cfg.url, cfg.publishableKey);
          const { data, error } = await client.auth.signInWithPassword({ email, password });
          if (error) throw error;
          if (!data?.session) throw new Error("O Supabase não retornou uma sessão de acesso.");
          say("Acesso confirmado. Abrindo o MultiAfiliados...");
          window.location.reload();
        } catch (error) {
          console.error("Falha no login MultiAfiliados:", error);
          const messageText = error?.message || "Não foi possível concluir o login.";
          say(messageText === "Invalid login credentials"
            ? "E-mail ou senha incorretos. Se a conta foi criada antes de desativar a confirmação, será necessário confirmá-la no Supabase."
            : "Falha no login: " + messageText);
        } finally {
          loginButton.disabled = false;
        }
      }, true);
    }
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