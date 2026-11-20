/* 信朴科技 XOMAPS 博客 · 引用增强（站点级）
   1) 正文 <sup>[n]</sup> 标引 → 文内锚点链接，点击平滑滚动定位到参考文献对应条目（不跳外站）
   2) 参考文献：给编号条目赋 id；裸 URL 自动转为链接；所有外部链接 target=_blank（不丢用户当前浏览） */
(function () {
  function ready(fn) {
    if (document.readyState !== "loading") { fn(); } else { document.addEventListener("DOMContentLoaded", fn); }
  }
  ready(function () {
    var content = document.querySelector(".content");
    if (!content) return;

    /* --- 定位参考文献小节（h2 标题 → 其后的 ol 列表） --- */
    var refsOl = null;
    var heads = content.querySelectorAll("h2");
    for (var i = 0; i < heads.length; i++) {
      if (/^(参考文献|参考资料|References)/.test(heads[i].textContent.trim())) {
        var el = heads[i].nextElementSibling;
        while (el && el.tagName !== "OL") { el = el.nextElementSibling; }
        if (el) { refsOl = el; break; }
      }
    }

    if (refsOl) {
      var items = refsOl.querySelectorAll(":scope > li");
      items.forEach(function (li, idx) {
        li.id = "ref-" + (idx + 1);
        li.style.scrollMarginTop = "2rem";
      });

      /* 裸 URL → 链接（参考文献条目里未写成 markdown 链接的地址） */
      var walker = document.createTreeWalker(refsOl, NodeFilter.SHOW_TEXT, null, false);
      var textNodes = [];
      while (walker.nextNode()) {
        if (/https?:\/\//.test(walker.currentNode.nodeValue)) textNodes.push(walker.currentNode);
      }
      textNodes.forEach(function (tn) {
        var frag = document.createDocumentFragment();
        var rest = tn.nodeValue, last = 0, m;
        var re = /https?:\/\/[^\s<>"]+/g;
        while ((m = re.exec(rest)) !== null) {
          var url = m[0].replace(/[。，；、]+$/, "");
          if (m.index > last) frag.appendChild(document.createTextNode(rest.slice(last, m.index)));
          var a = document.createElement("a");
          a.href = url;
          a.textContent = url;
          a.target = "_blank";
          a.rel = "noopener noreferrer";
          frag.appendChild(a);
          last = m.index + m[0].length;
        }
        if (last < rest.length) frag.appendChild(document.createTextNode(rest.slice(last)));
        tn.parentNode.replaceChild(frag, tn);
      });

      /* 参考文献里已有的外链同样 _blank */
      refsOl.querySelectorAll("a[href^='http']").forEach(function (a) {
        a.target = "_blank";
        a.rel = "noopener noreferrer";
      });
    }

    /* --- 上角标标引 → 文内锚点 --- */
    content.querySelectorAll("sup").forEach(function (sup) {
      var txt = sup.textContent.replace(/\s+/g, "");
      if (!/^\[(\d+)\](\[\d+\])*$/.test(txt)) return;
      sup.innerHTML = txt.replace(/\[(\d+)\]/g, function (_, n) {
        return '[<a href="#ref-' + n + '">' + n + "</a>]";
      });
    });

    /* --- 标引点击：平滑滚动到对应文献条目，不离开页面 --- */
    content.addEventListener("click", function (e) {
      var a = e.target.closest ? e.target.closest('a[href^="#ref-"]') : null;
      if (!a) return;
      var t = document.getElementById(a.getAttribute("href").slice(1));
      if (!t) return;
      e.preventDefault();
      t.scrollIntoView({ behavior: "smooth", block: "start" });
      history.replaceState(null, "", a.getAttribute("href"));
    });
  });
})();
