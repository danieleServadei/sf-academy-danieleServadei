const path = window.location.pathname.substr(1);

const nav = `
<!-- fixed-top-->
<nav class="header-navbar navbar-expand-md navbar navbar-with-menu navbar-without-dd-arrow fixed-top navbar-light navbar-bg-color">
  <div class="navbar-wrapper">
    <div class="navbar-header d-md-none">
      <ul class="nav navbar-nav flex-row">
        <li class="nav-item mobile-menu d-md-none mr-auto"><a class="nav-link nav-menu-main menu-toggle hidden-xs" href="#"><i class="ft-menu font-large-1"></i></a></li>
      </ul>
    </div>
  </div>
</nav>
<!-- ////////////////////////////////////////////////////////////////////////////-->
<div class="main-menu menu-fixed menu-dark menu-bg-default rounded menu-accordion menu-shadow">
  <div class="main-menu-content">
    <a class="navigation-brand d-none d-md-block d-lg-block d-xl-block" href="dashboard"></a>
    <ul class="navigation navigation-main" id="main-menu-navigation" data-menu="menu-navigation">
      <li class="nav-item" id="dashboard"><a href="dashboard"><i class="icon-grid"></i><span class="menu-title" data-i18n="">Dashboard</span></a>
      </li>
      <li class="nav-item" id="buy-ico"><a href="buy-ico"><i class="icon-layers"></i><span class="menu-title" data-i18n="">Buy ICO</span></a>
      </li>
      <li class="nav-item" id="wallet"><a href="wallet"><i class="icon-wallet"></i><span class="menu-title" data-i18n="">Wallet</span></a>
      </li>
      <li class="nav-item" id="transactions"><a href="transactions"><i class="icon-shuffle"></i><span class="menu-title" data-i18n="">Transactions</span></a>
      </li>
      <!-- <li class="nav-item" id="faq"><a href="faq"><i class="icon-support"></i><span class="menu-title" data-i18n="">FAQ</span></a>
      </li> -->
      <li class="nav-item" id="profile"><a href="profile"><i class="icon-user-following"></i><span class="menu-title" data-i18n="">Profile</span></a>
      </li>
    </ul>
  </div>
</div>`;

window.onload = () => {
  const page = document.getElementById(path);
  page.classList.remove('nav-item');
  page.classList.add('active');
}

document.getElementById("page").innerHTML = nav;