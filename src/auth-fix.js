// Fallback isolado para o cadastro: mantém o botão funcional mesmo se outro módulo falhar.
(function () {
  const ready = () => {
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