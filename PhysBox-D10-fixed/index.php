<?php
declare(strict_types=1);
// Small JSON API; the UI remains usable without PHP/database configuration.
if (isset($_GET['api'])) {
    header('Content-Type: application/json; charset=utf-8');
    header('X-Content-Type-Options: nosniff');
    $body = json_decode(file_get_contents('php://input') ?: '{}', true) ?: [];
    $op = $body['op'] ?? '';
    try {
        if ($op === 'linear') {
            $a=(float)($body['a']??0); $b=(float)($body['b']??0); $c=(float)($body['c']??0);
            $result = abs($a)<1e-14 ? (abs($b-$c)<1e-14 ? ['kind'=>'infinite'] : ['kind'=>'none']) : ['kind'=>'unique','x'=>($c-$b)/$a];
        } elseif ($op === 'quadratic') {
            $a=(float)($body['a']??0); $b=(float)($body['b']??0); $c=(float)($body['c']??0);
            if (abs($a)<1e-14) { if(abs($b)<1e-14) $result=['kind'=>abs($c)<1e-14?'infinite':'none']; else $result=['kind'=>'linear','roots'=>[-$c/$b]]; }
            else { $d=$b*$b-4*$a*$c; $result=['kind'=>$d<0?'complex':($d==0?'repeated':'real'),'roots'=>$d<0?[['re'=>-$b/(2*$a),'im'=>sqrt(-$d)/(2*$a)],['re'=>-$b/(2*$a),'im'=>-sqrt(-$d)/(2*$a)]]:[(-$b+sqrt(max(0,$d)))/(2*$a),(-$b-sqrt(max(0,$d)))/(2*$a)]]; }
        } elseif ($op === 'system') {
            $A=$body['A']??[]; $v=$body['b']??[];
            if (count($A)!==2 || count($v)!==2 || count($A[0]??[])!==2 || count($A[1]??[])!==2) throw new RuntimeException('bad');
            [$a1,$b1]=array_map('floatval',$A[0]); [$a2,$b2]=array_map('floatval',$A[1]); [$c1,$c2]=array_map('floatval',$v);
            $d=$a1*$b2-$a2*$b1;
            if (abs($d)<1e-12) {
                $bothZero=abs($a1)+abs($b1)+abs($a2)+abs($b2)<1e-12;
                $same=$bothZero ? (abs($c1)<1e-12 && abs($c2)<1e-12) : (abs($a1*$c2-$a2*$c1)<1e-12 && abs($b1*$c2-$b2*$c1)<1e-12);
                $result=['kind'=>$same?'infinite':'none'];
            } else {
                $x=($c1*$b2-$c2*$b1)/$d; $y=($a1*$c2-$a2*$c1)/$d;
                $result=['kind'=>'unique','solution'=>[$x,$y]];
            }
        } else throw new RuntimeException('bad');
        echo json_encode(['ok'=>true,'result'=>$result], JSON_UNESCAPED_UNICODE|JSON_INVALID_UTF8_SUBSTITUTE);
    } catch(Throwable $e) { http_response_code(400); echo json_encode(['ok'=>false,'error'=>'Invalid or unsupported input.'],JSON_UNESCAPED_UNICODE); }
    exit;
}
?><!doctype html><html lang="fa" dir="rtl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>PhysBox D10</title><link rel="stylesheet" href="assets/css/app.css"></head><body><div class="shell"><aside class="sidebar"><a class="brand" href="#home"><span class="logo">Φ</span><span>PhysBox <b>D10</b></span></a><nav id="nav"></nav><div class="side-bottom"><span class="muted" data-i="grade"></span><button id="theme" class="small">◐</button></div></aside><main><header><button class="mobile-menu" id="menu">☰</button><div><div class="eyebrow" data-i="workspace"></div><h1 id="pageTitle"></h1></div><div class="head-actions"><label class="search"><span>⌕</span><input id="search" data-ph="search"></label><button id="language" class="pill">English</button></div></header><section id="content"></section><footer>PhysBox D10 <span>·</span> <span data-i="footer"></span></footer></main></div><script src="assets/js/app.js"></script></body></html>
