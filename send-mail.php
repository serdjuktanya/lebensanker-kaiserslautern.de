<?php
// send-mail.php

header('Content-Type: application/json; charset=utf-8');

// читаем JSON
$raw = file_get_contents('php://input');
$data = json_decode($raw, true);

if (!$data) {
    echo json_encode(['ok' => false, 'error' => 'no data']);
    exit;
}

$name    = trim($data['name'] ?? '');
$contact = trim($data['contact'] ?? '');
$topic   = trim($data['topic'] ?? '');
$message = trim($data['message'] ?? '');
$to      = trim($data['to'] ?? 'mail@lebensanker-kaiserslautern.de');

if ($name === '' || $contact === '' || $topic === '') {
    echo json_encode(['ok' => false, 'error' => 'missing fields']);
    exit;
}

// маппинг значения в читаемое название
$topicLabel = 'Allgemeine Anfrage';
switch ($topic) {
    case 'ambulant':
        $topicLabel = 'Ambulanter Pflegedienst';
        break;
    case 'tagespflege':
        $topicLabel = 'Tagespflege';
        break;
    case 'beratung':
        $topicLabel = 'Allgemeine Beratung';
        break;
    // case 'psy': später
}

// тема письма
$subject = "Neue Kontaktanfrage – {$topicLabel}";

// HTML-тело письма (премиум)
$html  = "<html><body style=\"font-family:Arial,Helvetica,sans-serif;\">";
$html .= "<h2 style=\"color:#4B5338;\">Neue Kontaktanfrage</h2>";
$html .= "<p>Es wurde eine neue Anfrage über das Kontaktformular gesendet.</p>";
$html .= "<table cellspacing=\"0\" cellpadding=\"6\" style=\"border-collapse:collapse;\">";
$html .= "<tr><td><strong>Name:</strong></td><td>" . htmlspecialchars($name) . "</td></tr>";
$html .= "<tr><td><strong>Kontakt:</strong></td><td>" . htmlspecialchars($contact) . "</td></tr>";
$html .= "<tr><td><strong>Bereich:</strong></td><td>" . htmlspecialchars($topicLabel) . "</td></tr>";
$html .= "<tr><td valign=\"top\"><strong>Nachricht:</strong></td><td>" . nl2br(htmlspecialchars($message)) . "</td></tr>";
$html .= "</table>";
$html .= "<p style=\"font-size:12px;color:#555;margin-top:20px;\">";
$html .= "Diese Nachricht wurde automatisch vom Kontaktformular der Website gesendet.<br>";
$html .= "Bitte antworten Sie der anfragenden Person direkt.";
$html .= "</p>";
$html .= "<p style=\"font-weight:bold;color:#4B5338;\">Lebensanker Pflegestützpunkt GmbH</p>";
$html .= "</body></html>";

// обычный plain-текст (на случай, если HTML отключён)
$plain  = "Neue Kontaktanfrage\n\n";
$plain .= "Name: {$name}\n";
$plain .= "Kontakt: {$contact}\n";
$plain .= "Bereich: {$topicLabel}\n\n";
$plain .= "Nachricht:\n{$message}\n";

// от кого (можно оставить общий почтовый ящик)
$from = "mail@lebensanker-kaiserslautern.de";

// заголовки для HTML-письма
$headers  = "From: Lebensanker <{$from}>\r\n";
$headers .= "Reply-To: {$contact}\r\n";
$headers .= "MIME-Version: 1.0\r\n";
$headers .= "Content-Type: multipart/alternative; boundary=BOUNDARY\r\n";

// multipart (plain + html)
$body  = "--BOUNDARY\r\n";
$body .= "Content-Type: text/plain; charset=utf-8\r\n\r\n";
$body .= $plain . "\r\n";
$body .= "--BOUNDARY\r\n";
$body .= "Content-Type: text/html; charset=utf-8\r\n\r\n";
$body .= $html . "\r\n";
$body .= "--BOUNDARY--";

// отправка
$ok = mail($to, $subject, $body, $headers);

echo json_encode(['ok' => $ok ? true : false]);
