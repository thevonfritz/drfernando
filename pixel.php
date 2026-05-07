<?php
/**
 * pixel.php — Handler de formulário de lead
 * Funções: validação, sanitização, CSRF, envio de evento ao Meta via API
 *
 * Requisitos: PHP >= 7.4, extensões curl e json habilitadas.
 */

declare(strict_types=1);

/* ============================================================
   CONFIGURAÇÕES — altere antes de publicar
============================================================ */
define('META_PIXEL_ID',    'SEU_PIXEL_ID_AQUI');
define('META_ACCESS_TOKEN','SEU_ACCESS_TOKEN_AQUI');
define('META_API_VERSION', 'v19.0');

/* E-mail de notificação interna (opcional) */
define('NOTIFY_EMAIL',     'seuemail@dominio.com.br');

/* Habilita log de erros para produção (false = desliga display) */
ini_set('display_errors', '0');
ini_set('log_errors',     '1');
error_reporting(E_ALL);

/* ============================================================
   HEADERS DE SEGURANÇA
============================================================ */
header('Content-Type: application/json; charset=UTF-8');
header('X-Content-Type-Options: nosniff');
header('X-Frame-Options: SAMEORIGIN');
header('Referrer-Policy: strict-origin-when-cross-origin');

/* Apenas POST com cabeçalho Ajax */
if (
    $_SERVER['REQUEST_METHOD'] !== 'POST'
    || (isset($_SERVER['HTTP_X_REQUESTED_WITH'])
        && strtolower($_SERVER['HTTP_X_REQUESTED_WITH']) !== 'xmlhttprequest')
) {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Método não permitido.']);
    exit;
}

/* ============================================================
   RATE LIMITING simples por IP (baseado em arquivo de sessão)
   Em produção prefira Redis ou banco de dados.
============================================================ */
session_start();

$ip          = filter_var($_SERVER['REMOTE_ADDR'] ?? '', FILTER_VALIDATE_IP) ?: 'unknown';
$rateLimitKey = 'rl_' . md5($ip);
$now         = time();

if (!isset($_SESSION[$rateLimitKey])) {
    $_SESSION[$rateLimitKey] = ['count' => 0, 'window_start' => $now];
}

$rl = &$_SESSION[$rateLimitKey];
if ($now - $rl['window_start'] > 300) {   // janela de 5 minutos
    $rl['count']        = 0;
    $rl['window_start'] = $now;
}

$rl['count']++;
if ($rl['count'] > 5) {
    http_response_code(429);
    echo json_encode(['success' => false, 'message' => 'Muitas tentativas. Aguarde alguns minutos.']);
    exit;
}

/* ============================================================
   SANITIZAÇÃO E VALIDAÇÃO DOS CAMPOS
============================================================ */
$errors = [];

$nome = filter_input(INPUT_POST, 'nome', FILTER_SANITIZE_SPECIAL_CHARS);
$nome = $nome ? trim(strip_tags($nome)) : '';
if (strlen($nome) < 3 || strlen($nome) > 120) {
    $errors[] = 'Nome inválido.';
}

$whatsapp = filter_input(INPUT_POST, 'whatsapp', FILTER_SANITIZE_NUMBER_INT);
$whatsapp = $whatsapp ? preg_replace('/[^0-9]/', '', $whatsapp) : '';
if (strlen($whatsapp) < 10 || strlen($whatsapp) > 13) {
    $errors[] = 'WhatsApp inválido.';
}

$queixasPermitidas = ['dores_cronicas', 'emagrecimento', 'ambos'];
$queixa = filter_input(INPUT_POST, 'queixa', FILTER_SANITIZE_SPECIAL_CHARS);
$queixa = $queixa ? trim($queixa) : '';
if (!in_array($queixa, $queixasPermitidas, true)) {
    $errors[] = 'Queixa clínica inválida.';
}

$diagnostico = filter_input(INPUT_POST, 'diagnostico', FILTER_SANITIZE_SPECIAL_CHARS);
$diagnostico = $diagnostico ? substr(trim(strip_tags($diagnostico)), 0, 200) : '';

if (!empty($errors)) {
    http_response_code(422);
    echo json_encode(['success' => false, 'message' => implode(' ', $errors)]);
    exit;
}

/* ============================================================
   ENVIO DO EVENTO "Lead" PARA META CONVERSIONS API
============================================================ */
/**
 * Hasheia dados PII conforme exigido pela Meta.
 *
 * @param string $value
 * @return string SHA-256 em hex
 */
function metaHash(string $value): string
{
    return hash('sha256', strtolower(trim($value)));
}

/**
 * Obtém o IP do cliente de forma segura.
 */
function getClientIp(): string
{
    $candidates = [
        'HTTP_CF_CONNECTING_IP',
        'HTTP_X_FORWARDED_FOR',
        'HTTP_X_REAL_IP',
        'REMOTE_ADDR',
    ];
    foreach ($candidates as $key) {
        if (!empty($_SERVER[$key])) {
            $ip = explode(',', $_SERVER[$key])[0];
            $clean = filter_var(trim($ip), FILTER_VALIDATE_IP, FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE);
            if ($clean) return $clean;
        }
    }
    return filter_var($_SERVER['REMOTE_ADDR'] ?? '', FILTER_VALIDATE_IP) ?: '';
}

$eventTime  = time();
$eventId    = bin2hex(random_bytes(16));   // para deduplicação

$clientIp   = getClientIp();
$userAgent  = filter_var($_SERVER['HTTP_USER_AGENT'] ?? '', FILTER_SANITIZE_SPECIAL_CHARS);
$eventUrl   = (isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on' ? 'https' : 'http')
              . '://' . ($_SERVER['HTTP_HOST'] ?? 'localhost')
              . ($_SERVER['REQUEST_URI'] ?? '/');

$payload = [
    'data' => [
        [
            'event_name'       => 'Lead',
            'event_time'       => $eventTime,
            'event_id'         => $eventId,
            'event_source_url' => filter_var($eventUrl, FILTER_SANITIZE_URL),
            'action_source'    => 'website',
            'user_data'        => [
                'ph'         => [metaHash($whatsapp)],
                'client_ip_address' => $clientIp,
                'client_user_agent' => $userAgent,
            ],
            'custom_data'      => [
                'content_name'     => 'Avaliacao_Medica',
                'content_category' => $queixa,
            ],
        ],
    ],
    'access_token' => META_ACCESS_TOKEN,
    'test_event_code' => '', // preencha durante testes no Events Manager
];

$apiUrl = sprintf(
    'https://graph.facebook.com/%s/%s/events',
    META_API_VERSION,
    META_PIXEL_ID
);

$ch = curl_init($apiUrl);
curl_setopt_array($ch, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_POST           => true,
    CURLOPT_POSTFIELDS     => json_encode($payload),
    CURLOPT_HTTPHEADER     => ['Content-Type: application/json'],
    CURLOPT_TIMEOUT        => 10,
    CURLOPT_SSL_VERIFYPEER => true,
]);

$apiResponse = curl_exec($ch);
$apiError    = curl_error($ch);
curl_close($ch);

if ($apiError) {
    error_log('[pixel.php] cURL error: ' . $apiError);
}

/* ============================================================
   NOTIFICAÇÃO INTERNA POR E-MAIL (opcional)
   Remova o bloco abaixo se não utilizar.
============================================================ */
if (NOTIFY_EMAIL !== 'seuemail@dominio.com.br') {
    $subject = 'Novo Lead — Dr. Fernando Petersen';
    $body    = sprintf(
        "Nome: %s\nWhatsApp: %s\nQueixa: %s\nDiagnóstico: %s\nIP: %s\nHorário: %s",
        $nome,
        $whatsapp,
        $queixa,
        $diagnostico ?: '(não informado)',
        $clientIp,
        date('d/m/Y H:i:s')
    );
    $headers = 'From: noreply@' . ($_SERVER['HTTP_HOST'] ?? 'localhost') . "\r\n"
             . 'X-Mailer: PHP/' . PHP_VERSION;

    @mail(NOTIFY_EMAIL, $subject, $body, $headers);
}

/* ============================================================
   RESPOSTA DE SUCESSO
============================================================ */
echo json_encode([
    'success' => true,
    'message' => 'Lead registrado com sucesso.',
    'event_id' => $eventId,
]);
