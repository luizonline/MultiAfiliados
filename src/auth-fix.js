// Autenticação complementar: login, cadastro e recuperação de senha.
(function () {
  const ready = () => {
    const $ = (id) => document.getElementById(id);
    const say = (value) => { const el = $("authMessage"); if (el) el.textContent = value; };
    const cfg = window.MULTIAFILIADOS_SUPABASE;
    const sdk = window.supabase;
    if (!cfg?.url || !cfg?.publishableKey || !sdk?.createClient) {
      say("Não foi possível carregar o Supabase. Atualize a página e tente novamente.");
      return;
    }
    const client = sdk.createClient(cfg.url, cfg.publishableKey);
    const recoveryRequested = new URLSearchParams(window.location.search).get("reset-password") === "1" || window.location.hash.includes("type=recovery");
    const recoveryPanel = $("newPasswordPanel");
    if (recoveryRequested) {
      $("authScreen")?.classList.remove("hidden");
      $("authScreen").style.display = "grid";
      document.querySelector(".app-shell")?.classList.add("hidden");
      if (recoveryPanel) recoveryPanel.classList.remove("hidden");
      say("Acesse pelo link enviado ao seu e-mail e defina uma nova senha.");
    }
    client.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        $("authScreen")?.classList.remove("hidden");
        $("authScreen").style.display = "grid";
        document.querySelector(".app-shell")?.classList.add("hidden");
        recoveryPanel?.classList.remove("hidden");
        say("Link validado. Digite sua nova senha.");
      }
    });
    document.addEventListener("click", async (event) => {
      const button = event.target.closest("#loginBtn");
      if (!button || button.dataset.busy === "1") return;
      event.preventDefault(); event.stopPropagation();
      const email = ($("authEmail")?.value || "").trim().toLowerCase();
      const password = $("authPassword")?.value || "";
      if (!$("authEmail")?.checkValidity()) { say("Digite um e-mail válido."); $("authEmail")?.focus(); return; }
      if (password.length < 6) { say("A senha precisa ter pelo menos 6 caracteres."); $("authPassword")?.focus(); return; }
      button.dataset.busy = "1"; button.disabled = true; say("Tentando entrar no sistema...");
      try {
        const { error } = await client.auth.signInWithPassword({ email, password });
        if (error) throw error;
        say("Login realizado. Carregando o painel...");
        window.location.reload();
      } catch (error) {
        console.error("Erro de login:", error);
        say(error?.message === "Failed to fetch"
          ? "Falha de conexão com o Supabase. O serviço não respondeu; isso não confirma que a senha esteja errada."
          : error?.message === "Invalid login credentials"
            ? "E-mail ou senha incorretos. Use 'Esqueci minha senha' para criar uma nova."
            : "Não foi possível entrar: " + (error?.message || "erro desconhecido"));
      } finally { button.disabled = false; delete button.dataset.busy; }
    }, true);
    $("forgotPasswordBtn")?.addEventListener("click", async () => {
      const email = ($("authEmail")?.value || "").trim().toLowerCase();
      if (!$("authEmail")?.checkValidity()) { say("Digite seu e-mail no campo acima para receber o link de recuperação."); $("authEmail")?.focus(); return; }
      const button = $("forgotPasswordBtn"); button.disabled = true; say("Enviando link de recuperação...");
      try {
        const { error } = await client.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin + "/?reset-password=1" });
        if (error) throw error;
        say("Se o e-mail estiver cadastrado, enviaremos um link para redefinir sua senha. Verifique também o spam.");
      } catch (error) {
        console.error("Erro ao solicitar recuperação:", error);
        say("Não foi possível enviar o link: " + (error?.message || "falha de conexão com o Supabase."));
      } finally { button.disabled = false; }
    });
    $("saveNewPasswordBtn")?.addEventListener("click", async () => {
      const password = $("newPassword")?.value || "";
      if (password.length < 6) { say("A nova senha precisa ter pelo menos 6 caracteres."); $("newPassword")?.focus(); return; }
      const button = $("saveNewPasswordBtn"); button.disabled = true; say("Atualizando sua senha...");
      try {
        const { error } = await client.auth.updateUser({ password });
        if (error) throw error;
        history.replaceState(null, "", window.location.pathname);
        if (recoveryPanel) recoveryPanel.classList.add("hidden");
        $("authPassword").value = "";
        say("Senha alterada com sucesso. Agora entre com sua nova senha.");
      } catch (error) {
        console.error("Erro ao atualizar senha:", error);
        say("Não foi possível atualizar a senha: " + (error?.message || "o link pode ter expirado. Solicite outro."));
      } finally { button.disabled = false; }
    });

  };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", ready);
  else ready();
})();
