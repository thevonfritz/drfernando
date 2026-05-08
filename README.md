# Landing Page — Dr. Fernando Petersen

> Método ITF · Nutrologia · Medicina da Dor

---

## Estrutura de Pastas

```
/
├── index.html        # Página principal (todas as dobras)
├── styles.css        # Estilos globais (variáveis, layout, responsivo)
├── script.js         # JavaScript (formulário, carrossel, animações)
├── pixel.php         # Backend: recebe lead, dispara Meta Conversions API
├── README.md         # Esta documentação
└── img/
    ├── img.png       # Imagem hero (desktop ≥ 768 px)
    └── imgmb.png     # Imagem hero (mobile < 768 px)
```

---

## Bibliotecas e Dependências

| Recurso | Versão / Fonte | Finalidade |
|---|---|---|
| Google Fonts (Roboto + Open Sans) | CDN Google | Tipografia |
| Meta Pixel (fbevents.js) | CDN Facebook | Rastreio de PageView / Lead |
| PHP (nativo) | ≥ 7.4 | Backend do formulário |
| cURL (extensão PHP) | nativa | Envio para Conversions API |

> **Sem frameworks CSS ou JS externos.** Todo o código é vanilla para máxima performance.

---

## Seções da LP

### Dobra 1 — Hero
- **Arquivos:** `index.html` (section#hero), `styles.css` (.section-hero)
- **Imagens:** `img/img.png` (desktop), `img/imgmb.png` (mobile via `<picture>`)
- **Funcionalidade:** Headline de autoridade, subheadline, CTA âncora para `#formulario`, selos de CRM. Fundo com overlay escuro sobre imagem do médico.
- **Notas:** A animação `.animate-fade-up` usa CSS keyframes com delays escalonados.

### Dobra 2 — Prova Social
- **Arquivos:** `index.html` (section#resultados), `styles.css` (.section-proof)
- **Funcionalidade:** Carrossel de fotos Antes/Depois com autoplay a cada 5 s, suporte a swipe touch, controles de teclado. Grid de 3 depoimentos em glassmorphism.
- **Notas:** As fotos de pacientes devem ser inseridas nos `.ba-image-wrapper` substituindo os `.ba-placeholder`. Atribuir `alt` descritivo para acessibilidade.

### Dobra 3 — O Método
- **Arquivos:** `index.html` (section#metodo), `styles.css` (.section-method, .pillars-grid)
- **Funcionalidade:** Fundo escuro (#00204F) com padrão de pontos, 3 cards de pilares em glassmorphism escuro com ícones SVG inline.
- **Notas:** O card central (`.featured-pillar`) tem destaque visual em borda azul.

### Dobra 4 — Formulário de Qualificação
- **Arquivos:** `index.html` (section#formulario), `styles.css` (.section-form), `script.js` (initForm), `pixel.php`
- **Funcionalidade:** Formulário com 4 campos, validação client-side (JS) e server-side (PHP), máscara de telefone, CSRF token, envio AJAX, disparo de `fbq('track','Lead')` e Meta Conversions API no sucesso.
- **Notas:** Ao enviar com sucesso, o formulário some e a mensagem `.form-success` aparece. Não há reload de página.

### Dobra 5 — Sobre o Dr. Fernando
- **Arquivos:** `index.html` (section#sobre), `styles.css` (.section-about)
- **Funcionalidade:** Grid de 2 colunas (foto + texto), credenciais CRM, lista de qualificações, CTA final.
- **Notas:** O `.doctor-photo-placeholder` deve ser substituído por `<img>` da foto real do Dr. Fernando. Manter o `alt` descritivo.

### Footer
- **Arquivos:** `index.html` (footer#footer), `styles.css` (.site-footer)
- **Funcionalidade:** Logotipo com iniciais "FP", endereço, registros CRM/RQE, disclaimer legal, ano automático via JS.
- **Notas:** Atualizar o link do WhatsApp em `href="https://wa.me/55SEUNUMERO"` com o número real.

---

## Integrações

### Meta Pixel (client-side)
Localização: `index.html`, bloco `<script>` no `<head>`.

```js
fbq('init', 'SEU_PIXEL_ID_AQUI');   // substitua pelo ID real
fbq('track', 'PageView');
```

O evento `Lead` é disparado em `script.js` após envio bem-sucedido do formulário:

```js
fbq('track', 'Lead', { content_name: 'Avaliacao_Medica', content_category: queixa });
```

### Meta Conversions API (server-side)
Localização: `pixel.php`, função cURL para `graph.facebook.com`.

Dados enviados:
- `event_name`: `Lead`
- `event_time`: timestamp Unix
- `event_id`: UUID aleatório (para deduplicação com o pixel client-side)
- `user_data.ph`: hash SHA-256 do WhatsApp
- `client_ip_address`, `client_user_agent`

**Configuração obrigatória antes de publicar:**

```php
define('META_PIXEL_ID',    'SEU_PIXEL_ID_AQUI');
define('META_ACCESS_TOKEN','SEU_ACCESS_TOKEN_AQUI');
define('NOTIFY_EMAIL',     'seuemail@dominio.com.br');
```

---

## Responsividade

| Breakpoint | Comportamento |
|---|---|
| ≥ 1024 px (Desktop) | Layout completo em duas colunas onde aplicável |
| 768–1023 px (Tablet) | Colunas colapsam para 1 coluna, footer em 2 colunas |
| ≤ 767 px (Mobile) | Layout totalmente em 1 coluna, fontes reduzidas via `clamp()` |
| ≤ 360 px (Pequeno) | Paddings e botões compactos |

Testado com Chrome DevTools nos perfis: iPhone SE (375 px), iPad (768 px), Desktop 1440 px.

---

## Segurança

| Medida | Onde | Implementação |
|---|---|---|
| Sanitização de inputs | `pixel.php` | `filter_input()` + `strip_tags()` + `substr()` |
| Proteção XSS | `pixel.php` | `FILTER_SANITIZE_SPECIAL_CHARS` em todos os campos |
| CSRF token | `script.js` + `pixel.php` | Token gerado com `crypto.getRandomValues` no front; validação no back |
| Rate limiting | `pixel.php` | Máx. 5 requisições por IP a cada 5 min (via `$_SESSION`) |
| Headers de segurança | `pixel.php` | `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy` |
| Hash de PII | `pixel.php` | WhatsApp enviado à Meta apenas como SHA-256 |
| SSL verificado | `pixel.php` | `CURLOPT_SSL_VERIFYPEER => true` |

> **Importante:** Em produção, configure o servidor com HTTPS e os headers CSP via `.htaccess` ou configuração do servidor.

---

## Como Adicionar Imagens dos Pacientes

1. Coloque as fotos em `img/` (formato WebP recomendado).
2. No HTML, substitua cada `.ba-placeholder` por:

```html
<img src="img/paciente-01-antes.webp" alt="Paciente antes do tratamento — [descrição]" loading="lazy" />
```

3. Mantenha a proporção 3:4 definida em CSS (`.ba-image-wrapper { aspect-ratio: 3/4; }`).

---

## Como Adicionar a Foto do Dr. Fernando

Substitua o bloco `.doctor-photo-placeholder` em `index.html` por:

```html
<img
  src="img/dr-fernando-petersen.webp"
  alt="Dr. Fernando Petersen em seu consultório, sorridente e profissional"
  loading="lazy"
  class="doctor-photo"
/>
```

Adicione em `styles.css`:
```css
.doctor-photo {
  width: 100%;
  max-width: 400px;
  border-radius: var(--radius-xl);
  object-fit: cover;
  aspect-ratio: 3/4;
}
```

---

## Como Contribuir / Expandir

- **Nova dobra:** crie uma `<section id="nome-da-dobra">` em `index.html` seguindo o padrão das existentes, adicione os estilos correspondentes em `styles.css`.
- **Novo evento de pixel:** chame `fbq('track', 'EventName', {...})` em `script.js` e espelhe com um `POST` cURL em `pixel.php`.
- **Trocar paleta:** edite as variáveis `--color-*` no topo de `styles.css`. Todos os elementos referenciam essas variáveis.
- **Adicionar vídeos de depoimento:** substitua os `.testimonial-card` por `<video>` com `controls` e `preload="none"`.

---

## Checklist de Publicação

- [ ] Substituir `SEU_PIXEL_ID_AQUI` e `SEU_ACCESS_TOKEN_AQUI` em `index.html` e `pixel.php`
- [ ] Substituir `seuemail@dominio.com.br` em `pixel.php`
- [ ] Substituir link do WhatsApp no footer (`wa.me/55SEUNUMERO`)
- [ ] Adicionar foto real do Dr. Fernando em `img/`
- [ ] Adicionar fotos de antes/depois dos pacientes em `img/`
- [ ] Adicionar imagem hero em `img/img.png` (desktop) e `img/imgmb.png` (mobile)
- [ ] Validar HTML em [validator.w3.org](https://validator.w3.org)
- [ ] Validar CSS em [jigsaw.w3.org/css-validator](https://jigsaw.w3.org/css-validator)
- [ ] Testar formulário com Meta Pixel Helper
- [ ] Configurar HTTPS e headers CSP no servidor
- [ ] Otimizar imagens para WebP
- [ ] Compactar em ZIP: `DrFernandoPetersen_LP_YYYY-MM-DD.zip`

---

*Documentação gerada em 2026-05-07.*
