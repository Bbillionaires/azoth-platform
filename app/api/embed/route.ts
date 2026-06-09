import { NextRequest } from 'next/server'

export async function GET(req: NextRequest) {
  const apiKey = req.nextUrl.searchParams.get('key') ?? ''
  const workspaceId = req.nextUrl.searchParams.get('workspace') ?? ''
  const color = req.nextUrl.searchParams.get('color') ?? '#e8a045'
  const source = req.nextUrl.searchParams.get('source') ?? 'embed'

  const script = `
(function() {
  var AZOTH_CONFIG = {
    apiKey: ${JSON.stringify(apiKey)},
    workspaceId: ${JSON.stringify(workspaceId)},
    color: ${JSON.stringify(color)},
    source: ${JSON.stringify(source)},
    endpoint: 'https://azoth-platform.vercel.app/api/contacts'
  };

  // Create floating button
  var btn = document.createElement('button');
  btn.innerHTML = '&#128172; Get in Touch';
  btn.style.cssText = 'position:fixed;bottom:24px;right:24px;z-index:9999;background:' + AZOTH_CONFIG.color + ';color:#fff;border:none;padding:12px 20px;border-radius:50px;font-size:14px;font-weight:600;cursor:pointer;box-shadow:0 4px 20px rgba(0,0,0,0.3);transition:transform 0.2s;font-family:sans-serif;';
  btn.onmouseenter = function(){ this.style.transform='scale(1.05)'; };
  btn.onmouseleave = function(){ this.style.transform='scale(1)'; };

  // Create modal
  var modal = document.createElement('div');
  modal.style.cssText = 'display:none;position:fixed;inset:0;z-index:10000;background:rgba(0,0,0,0.7);backdrop-filter:blur(4px);align-items:center;justify-content:center;';
  modal.innerHTML = '<div style="background:#111;border:1px solid rgba(255,255,255,0.1);border-radius:16px;padding:32px;max-width:420px;width:90%;font-family:sans-serif;"><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:24px;"><h3 style="color:#fff;margin:0;font-size:18px;font-weight:600;">Get in Touch</h3><button id="azoth-close" style="background:none;border:none;color:rgba(255,255,255,0.5);font-size:24px;cursor:pointer;line-height:1;">&times;</button></div><form id="azoth-form"><div style="margin-bottom:14px;"><input id="azoth-name" placeholder="Your Name" required style="width:100%;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.1);border-radius:8px;padding:12px 14px;color:#fff;font-size:14px;box-sizing:border-box;outline:none;"></div><div style="margin-bottom:14px;"><input id="azoth-email" type="email" placeholder="Email Address" required style="width:100%;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.1);border-radius:8px;padding:12px 14px;color:#fff;font-size:14px;box-sizing:border-box;outline:none;"></div><div style="margin-bottom:20px;"><textarea id="azoth-message" placeholder="How can we help?" rows="3" style="width:100%;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.1);border-radius:8px;padding:12px 14px;color:#fff;font-size:14px;box-sizing:border-box;outline:none;resize:none;"></textarea></div><button type="submit" id="azoth-submit" style="width:100%;background:' + AZOTH_CONFIG.color + ';color:#fff;border:none;padding:13px;border-radius:8px;font-size:14px;font-weight:600;cursor:pointer;">Send Message</button><p id="azoth-status" style="text-align:center;margin-top:12px;font-size:13px;color:rgba(255,255,255,0.5);"></p></form></div>';

  document.body.appendChild(btn);
  document.body.appendChild(modal);

  btn.onclick = function(){ modal.style.display='flex'; };
  document.getElementById('azoth-close').onclick = function(){ modal.style.display='none'; };
  modal.onclick = function(e){ if(e.target===modal) modal.style.display='none'; };

  document.getElementById('azoth-form').onsubmit = function(e) {
    e.preventDefault();
    var submit = document.getElementById('azoth-submit');
    var status = document.getElementById('azoth-status');
    submit.textContent = 'Sending...';
    submit.disabled = true;
    var affRef = localStorage.getItem('aff_ref') || '';
    fetch(AZOTH_CONFIG.endpoint, {
      method: 'POST',
      headers: { 'Content-Type':'application/json', 'Authorization':'Bearer '+AZOTH_CONFIG.apiKey, 'x-workspace-id':AZOTH_CONFIG.workspaceId },
      body: JSON.stringify({ name: document.getElementById('azoth-name').value, email: document.getElementById('azoth-email').value, notes: document.getElementById('azoth-message').value, source: AZOTH_CONFIG.source + (affRef ? '?ref='+affRef : ''), tags: ['embed-widget'] })
    }).then(function(r){ return r.json(); }).then(function(){
      status.style.color='#10b981';
      status.textContent='&#10003; Message sent! We will be in touch soon.';
      submit.style.display='none';
      setTimeout(function(){ modal.style.display='none'; submit.style.display='block'; submit.textContent='Send Message'; submit.disabled=false; status.textContent=''; document.getElementById('azoth-form').reset(); }, 3000);
    }).catch(function(){
      status.style.color='#ef4444';
      status.textContent='Something went wrong. Please try again.';
      submit.textContent='Send Message';
      submit.disabled=false;
    });
  };
})();
`

  return new Response(script, {
    headers: {
      'Content-Type': 'application/javascript',
      'Cache-Control': 'public, max-age=3600',
      'Access-Control-Allow-Origin': '*',
    },
  })
}
