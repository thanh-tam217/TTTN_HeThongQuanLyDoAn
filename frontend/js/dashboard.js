/* global bootstrap */

document.addEventListener('DOMContentLoaded', function() {
    const currentUser = checkAuth();
    if (!currentUser) return;

    renderHeaderInfo(currentUser);
    renderSidebarByRole(currentUser.vai_tro);

    // Tự động tải trang mặc định dựa theo vai trò
    if (currentUser.vai_tro === 'admin') loadAdminDotDoAn();
    else if (currentUser.vai_tro === 'giang_vien') loadGVDeTai();
    else if (currentUser.vai_tro === 'sinh_vien') loadSVDanhSachDeTai();

    document.getElementById('btnLogout').addEventListener('click', handleLogout);
});

function renderHeaderInfo(user) {
    document.getElementById('userName').textContent = user.ho_ten;
    document.getElementById('welcomeTitle').textContent = `Chào mừng, ${user.ho_ten}! 👋`;
    document.getElementById('userAvatar').textContent = user.ho_ten.charAt(0).toUpperCase();

    const roleBadge = document.getElementById('roleBadge');
    roleBadge.textContent = user.vai_tro.replace('_', ' ');
    roleBadge.className = `role-badge role-${user.vai_tro}`;
}

function setActiveMenu(element) {
    const links = document.querySelectorAll('#sidebarMenu a');
    links.forEach(l => l.classList.remove('active'));
    if (element) element.classList.add('active');
}

function renderSidebarByRole(role) {
    const sidebarMenu = document.getElementById('sidebarMenu');
    let menuHTML = '';

    if (role === 'admin') {
        menuHTML = `
            <li><a href="javascript:void(0)" class="active" onclick="setActiveMenu(this); loadAdminDotDoAn()"><i class="fa-solid fa-calendar-days"></i> Quản lý Đợt Đồ án</a></li>
            <li><a href="javascript:void(0)" onclick="setActiveMenu(this); loadAdminTaiKhoan()"><i class="fa-solid fa-users-gear"></i> Quản lý Tài khoản</a></li>
            <li><a href="javascript:void(0)" onclick="setActiveMenu(this); loadProfile()"><i class="fa-solid fa-user"></i> Thông tin cá nhân</a></li>
        `;
    } else if (role === 'giang_vien') {
        menuHTML = `
            <li><a href="javascript:void(0)" class="active" onclick="setActiveMenu(this); loadGVDeTai()"><i class="fa-solid fa-book-bookmark"></i> Quản lý Đề tài</a></li>
            <li><a href="javascript:void(0)" onclick="setActiveMenu(this); loadGVDanhSachSinhVien()"><i class="fa-solid fa-users-viewfinder"></i> Danh sách sinh viên</a></li>
            <li><a href="javascript:void(0)" onclick="setActiveMenu(this); loadGVDuyetGiaHan()"><i class="fa-solid fa-clock-rotate-left"></i> Duyệt Xin gia hạn</a></li>
            <li><a href="javascript:void(0)" onclick="setActiveMenu(this); loadProfile()"><i class="fa-solid fa-user"></i> Thông tin cá nhân</a></li>
        `;
    } else if (role === 'sinh_vien') {
        menuHTML = `
            <li><a href="javascript:void(0)" class="active" onclick="setActiveMenu(this); loadSVDanhSachDeTai()"><i class="fa-solid fa-list-check"></i> Tra cứu & Đăng ký</a></li>
            <li><a href="javascript:void(0)" onclick="setActiveMenu(this); loadSVDeTaiCuaToi()"><i class="fa-solid fa-file-arrow-up"></i> Đề tài & Nộp báo cáo</a></li>
            <li><a href="javascript:void(0)" onclick="setActiveMenu(this); loadProfile()"><i class="fa-solid fa-user"></i> Thông tin cá nhân</a></li>
        `;
    }
    sidebarMenu.innerHTML = menuHTML;
}

// ========================================================
// 1. PHÂN HỆ ADMIN
// ========================================================
let cacheListDot = [];

async function loadAdminDotDoAn() {
    const mainContent = document.getElementById('mainContent');
    mainContent.innerHTML = `
        <div class="d-flex justify-content-between align-items-center mb-4">
            <h4 class="fw-bold text-primary m-0"><i class="fa-solid fa-calendar-days me-2"></i>Quản lý Đợt Đồ án</h4>
            <button class="btn btn-primary rounded-pill px-4 fw-bold" onclick="showModalTaoDot()">
                <i class="fa-solid fa-plus me-1"></i> Tạo đợt mới
            </button>
        </div>
        <div class="table-responsive">
            <table class="table table-hover align-middle border rounded-3 overflow-hidden">
                <thead class="table-light">
                    <tr><th>#</th><th>Tên đợt đồ án</th><th>Năm học / HK</th><th>Loại</th><th>Hạn nộp báo cáo</th><th>Trạng thái</th><th>Thao tác</th></tr>
                </thead>
                <tbody id="dotTableBody">
                    <tr><td colspan="7" class="text-center py-4"><div class="spinner-border text-primary"></div></td></tr>
                </tbody>
            </table>
        </div>
    `;

    try {
        cacheListDot = await fetchAPI('/dot-do-an');
        renderDotRows(cacheListDot);
    } catch (error) {
        document.getElementById('dotTableBody').innerHTML = `<tr><td colspan="7" class="text-danger text-center py-3">${error.message}</td></tr>`;
    }
}

function renderDotRows(listDot) {
    const tableBody = document.getElementById('dotTableBody');
    if (!tableBody) return;

    if (!listDot || listDot.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="7" class="text-center text-muted py-4">Chưa có đợt đồ án nào.</td></tr>`;
        return;
    }

    tableBody.innerHTML = listDot.map((dot, index) => {
        const ngayBD = new Date(dot.ngay_bat_dau).toISOString().split('T')[0];
        const ngayKT = new Date(dot.ngay_ket_thuc).toISOString().split('T')[0];
        return `
            <tr>
                <td>${index + 1}</td>
                <td class="fw-bold text-primary">${dot.ten_dot}</td>
                <td>${dot.nam_hoc} (HK${dot.hoc_ky})</td>
                <td><span class="badge bg-info text-dark">${dot.loai_do_an}</span></td>
                <td>${new Date(dot.han_nop_bao_cao).toLocaleDateString('vi-VN')}</td>
                <td>
                    <button class="btn btn-sm ${dot.trang_thai ? 'btn-success' : 'btn-secondary'} rounded-pill px-3" onclick="toggleStatusDotAction('${dot._id}')">
                        <i class="fa-solid ${dot.trang_thai ? 'fa-lock-open' : 'fa-lock'} me-1"></i> ${dot.trang_thai ? 'Đang mở' : 'Đã đóng'}
                    </button>
                </td>
                <td>
                    <button class="btn btn-sm btn-outline-primary rounded-pill me-1" onclick="showModalSuaDot('${dot._id}', '${dot.ten_dot}', '${dot.nam_hoc}', ${dot.hoc_ky}, '${ngayBD}', '${ngayKT}')">
                        <i class="fa-solid fa-pen"></i> Sửa
                    </button>
                    <button class="btn btn-sm btn-outline-danger rounded-pill" onclick="deleteDotAction('${dot._id}', '${dot.ten_dot}')">
                        <i class="fa-solid fa-trash"></i> Xóa
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

function autoGenerateTenDot() {
    const loaiSelect = document.getElementById('loaiDoAnInput');
    const tenLoai = loaiSelect.options[loaiSelect.selectedIndex].getAttribute('data-label') || 'Đồ án';
    const hocKy = document.getElementById('hocKyInput').value;
    const namHoc = document.getElementById('namHocInput').value;
    document.getElementById('tenDotInput').value = `${tenLoai} HK${hocKy} ${namHoc}`;
}

function showModalTaoDot() {
    const selectNamHoc = document.getElementById('namHocInput');
    selectNamHoc.innerHTML = '';
    const currentYear = new Date().getFullYear();
    for (let i = -1; i <= 2; i++) {
        const val = `${currentYear + i}-${currentYear + i + 1}`;
        selectNamHoc.innerHTML += `<option value="${val}" ${i === 0 ? 'selected' : ''}>${val}</option>`;
    }
    autoGenerateTenDot();

    const modal = new bootstrap.Modal(document.getElementById('modalTaoDot'));
    modal.show();

    document.getElementById('formTaoDot').onsubmit = async function(e) {
        e.preventDefault();
        const ngayKT = document.getElementById('ngayKetThucInput').value;
        const bodyData = {
            ten_dot: document.getElementById('tenDotInput').value,
            nam_hoc: document.getElementById('namHocInput').value,
            hoc_ky: Number(document.getElementById('hocKyInput').value),
            loai_do_an: document.getElementById('loaiDoAnInput').value,
            ngay_bat_dau: document.getElementById('ngayBatDauInput').value,
            ngay_ket_thuc: ngayKT,
            han_nop_bao_cao: `${ngayKT}T23:59:59.000Z`
        };
        try {
            const res = await fetchAPI('/dot-do-an', 'POST', bodyData);
            alert(res.message);
            modal.hide();
            loadAdminDotDoAn();
        } catch (error) { alert(error.message); }
    };
}

function showModalSuaDot(id, tenDot, namHoc, hocKy, ngayBD, ngayKT) {
    document.getElementById('editDotId').value = id;
    document.getElementById('editTenDotInput').value = tenDot;
    document.getElementById('editNamHocInput').value = namHoc;
    document.getElementById('editHocKyInput').value = hocKy;
    document.getElementById('editNgayBatDauInput').value = ngayBD;
    document.getElementById('editNgayKetThucInput').value = ngayKT;

    const modal = new bootstrap.Modal(document.getElementById('modalSuaDot'));
    modal.show();

    document.getElementById('formSuaDot').onsubmit = async function(e) {
        e.preventDefault();
        const editId = document.getElementById('editDotId').value;
        const ngayKetThuc = document.getElementById('editNgayKetThucInput').value;
        const bodyData = {
            ten_dot: document.getElementById('editTenDotInput').value,
            hoc_ky: Number(document.getElementById('editHocKyInput').value),
            ngay_bat_dau: document.getElementById('editNgayBatDauInput').value,
            ngay_ket_thuc: ngayKetThuc,
            han_nop_bao_cao: `${ngayKetThuc}T23:59:59.000Z`
        };
        try {
            const res = await fetchAPI(`/dot-do-an/${editId}`, 'PUT', bodyData);
            alert(res.message);
            modal.hide();
            loadAdminDotDoAn();
        } catch (error) { alert(error.message); }
    };
}

async function toggleStatusDotAction(id) {
    try {
        const res = await fetchAPI(`/dot-do-an/${id}/toggle`, 'PUT');
        alert(res.message);
        loadAdminDotDoAn();
    } catch (error) { alert(error.message); }
}

async function deleteDotAction(id, tenDot) {
    if (!confirm(`Bạn có chắc muốn xóa đợt đồ án "${tenDot}"?`)) return;
    try {
        const res = await fetchAPI(`/dot-do-an/${id}`, 'DELETE');
        alert(res.message);
        loadAdminDotDoAn();
    } catch (error) { alert(error.message); }
}

// Quản lý tài khoản
let cacheListUsers = [];

async function loadAdminTaiKhoan() {
    const mainContent = document.getElementById('mainContent');
    mainContent.innerHTML = `
        <div class="d-flex justify-content-between align-items-center mb-4">
            <h4 class="fw-bold text-primary m-0"><i class="fa-solid fa-users-gear me-2"></i>Quản lý Tài khoản Hệ thống</h4>
            <button class="btn btn-primary rounded-pill px-4 fw-bold" onclick="showModalCapTaiKhoan()">
                <i class="fa-solid fa-user-plus me-1"></i> Cấp tài khoản mới
            </button>
        </div>
        <div class="row g-3 mb-4 bg-light p-3 rounded-4 border">
            <div class="col-md-7">
                <div class="input-group">
                    <span class="input-group-text bg-white"><i class="fa-solid fa-magnifying-glass text-muted"></i></span>
                    <input type="text" id="searchUserInput" class="form-control" placeholder="Tìm theo Mã số hoặc Họ tên..." oninput="filterUsersCombined()">
                </div>
            </div>
            <div class="col-md-5">
                <select id="filterRoleSelect" class="form-select" onchange="filterUsersCombined()">
                    <option value="all">-- Tất cả vai trò --</option>
                    <option value="sinh_vien">Sinh viên</option>
                    <option value="giang_vien">Giảng viên</option>
                    <option value="admin">Quản trị viên (Admin)</option>
                </select>
            </div>
        </div>
        <div class="table-responsive">
            <table class="table table-hover align-middle border rounded-3 overflow-hidden">
                <thead class="table-light">
                    <tr><th>#</th><th>Mã Số</th><th>Họ và Tên</th><th>Email</th><th>Vai Trò</th><th>Thao Tác</th></tr>
                </thead>
                <tbody id="usersTableBody">
                    <tr><td colspan="6" class="text-center py-4"><div class="spinner-border text-primary"></div></td></tr>
                </tbody>
            </table>
        </div>
    `;

    try {
        cacheListUsers = await fetchAPI('/auth/users');
        renderUsersRows(cacheListUsers);
    } catch (error) {
        document.getElementById('usersTableBody').innerHTML = `<tr><td colspan="6" class="text-danger text-center py-3">${error.message}</td></tr>`;
    }
}

function renderUsersRows(listUsers) {
    const tableBody = document.getElementById('usersTableBody');
    if (!tableBody) return;
    if (!listUsers || listUsers.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="6" class="text-center text-muted py-4">Không tìm thấy tài khoản nào.</td></tr>`;
        return;
    }
    tableBody.innerHTML = listUsers.map((u, index) => {
        let badge = '<span class="badge bg-primary">SINH VIÊN</span>';
        if (u.vai_tro === 'admin') badge = '<span class="badge bg-danger">ADMIN</span>';
        if (u.vai_tro === 'giang_vien') badge = '<span class="badge bg-indigo text-white" style="background:#4338ca">GIẢNG VIÊN</span>';
        return `
            <tr>
                <td>${index + 1}</td>
                <td class="fw-bold text-primary">${u.ma_so}</td>
                <td class="fw-bold text-dark">${u.ho_ten}</td>
                <td>${u.email}</td>
                <td>${badge}</td>
                <td>
                    <button class="btn btn-sm btn-outline-primary rounded-pill me-1" onclick="showModalSuaTaiKhoan('${u._id}', '${u.ma_so}', '${u.ho_ten}', '${u.email}', '${u.vai_tro}')">
                        <i class="fa-solid fa-pen"></i> Sửa
                    </button>
                    <button class="btn btn-sm btn-outline-danger rounded-pill" onclick="deleteUserAction('${u._id}', '${u.ho_ten}')">
                        <i class="fa-solid fa-trash"></i> Xóa
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

function filterUsersCombined() {
    const keyword = (document.getElementById('searchUserInput')?.value || '').toLowerCase().trim();
    const role = document.getElementById('filterRoleSelect')?.value || 'all';
    const filtered = cacheListUsers.filter(u => {
        const matchesKey = u.ma_so.toLowerCase().includes(keyword) || u.ho_ten.toLowerCase().includes(keyword);
        const matchesRole = role === 'all' || u.vai_tro === role;
        return matchesKey && matchesRole;
    });
    renderUsersRows(filtered);
}

async function autoFetchNextMaSo() {
    const role = document.getElementById('userRoleInput').value;
    try {
        const data = await fetchAPI(`/auth/next-ma-so/${role}`);
        if (data && data.nextMaSo) document.getElementById('userMaSoInput').value = data.nextMaSo;
    } catch (e) { console.error(e); }
}

async function showModalCapTaiKhoan() {
    await autoFetchNextMaSo();
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let pass = '';
    for (let i = 0; i < 8; i++) pass += chars.charAt(Math.floor(Math.random() * chars.length));
    document.getElementById('userPasswordInput').value = pass;
    document.getElementById('userHoTenInput').value = '';
    document.getElementById('userEmailInput').value = '';

    const modal = new bootstrap.Modal(document.getElementById('modalCapTaiKhoan'));
    modal.show();

    document.getElementById('formCapTaiKhoan').onsubmit = async function(e) {
        e.preventDefault();
        const bodyData = {
            ma_so: document.getElementById('userMaSoInput').value.trim(),
            ho_ten: document.getElementById('userHoTenInput').value.trim(),
            email: document.getElementById('userEmailInput').value.trim(),
            vai_tro: document.getElementById('userRoleInput').value,
            mat_khau: document.getElementById('userPasswordInput').value.trim()
        };
        try {
            const res = await fetchAPI('/auth/register', 'POST', bodyData);
            alert(`🎉 ${res.message}\n🔑 Mật khẩu: ${bodyData.mat_khau}`);
            modal.hide();
            loadAdminTaiKhoan();
        } catch (error) { alert('Lỗi: ' + error.message); }
    };
}

function showModalSuaTaiKhoan(id, maSo, hoTen, email, vaiTro) {
    document.getElementById('editUserId').value = id;
    document.getElementById('editMaSoInput').value = maSo;
    document.getElementById('editHoTenInput').value = hoTen;
    document.getElementById('editEmailInput').value = email;
    document.getElementById('editRoleInput').value = vaiTro;
    document.getElementById('editPasswordInput').value = '';

    const modal = new bootstrap.Modal(document.getElementById('modalSuaTaiKhoan'));
    modal.show();

    document.getElementById('formSuaTaiKhoan').onsubmit = async function(e) {
        e.preventDefault();
        const editId = document.getElementById('editUserId').value;
        const bodyData = {
            ho_ten: document.getElementById('editHoTenInput').value.trim(),
            email: document.getElementById('editEmailInput').value.trim(),
            vai_tro: document.getElementById('editRoleInput').value,
            mat_khau_moi: document.getElementById('editPasswordInput').value.trim()
        };
        try {
            const res = await fetchAPI(`/auth/users/${editId}`, 'PUT', bodyData);
            alert(res.message);
            modal.hide();
            loadAdminTaiKhoan();
        } catch (error) { alert(error.message); }
    };
}

async function deleteUserAction(id, hoTen) {
    if (!confirm(`Bạn có chắc muốn xóa tài khoản "${hoTen}"?`)) return;
    try {
        const res = await fetchAPI(`/auth/users/${id}`, 'DELETE');
        alert(res.message);
        loadAdminTaiKhoan();
    } catch (error) { alert(error.message); }
}

// ========================================================
// 2. PHÂN HỆ GIẢNG VIÊN
// ========================================================
let cacheListGVDeTai = [];

async function loadGVDeTai() {
    const mainContent = document.getElementById('mainContent');
    mainContent.innerHTML = `
        <div class="d-flex justify-content-between align-items-center mb-4">
            <h4 class="fw-bold text-primary m-0"><i class="fa-solid fa-book-bookmark me-2"></i>Quản lý Đề tài Hướng dẫn</h4>
            <button class="btn btn-primary rounded-pill px-4 fw-bold" onclick="showModalTaoDeTai()">
                <i class="fa-solid fa-plus me-1"></i> Đăng tải đề tài mới
            </button>
        </div>

        <!-- Thanh Tìm kiếm Realtime theo Tên Đề Tài -->
        <div class="row g-3 mb-4 bg-light p-3 rounded-4 border">
            <div class="col-md-12">
                <div class="input-group">
                    <span class="input-group-text bg-white"><i class="fa-solid fa-magnifying-glass text-muted"></i></span>
                    <input type="text" id="searchGVDeTaiInput" class="form-control" placeholder="Nhập tên đề tài hoặc mô tả để tìm kiếm nhanh..." oninput="filterGVDeTaiRealtime()">
                </div>
            </div>
        </div>

        <div class="table-responsive">
            <table class="table table-hover align-middle border rounded-3 overflow-hidden">
                <thead class="table-light">
                    <tr><th>#</th><th>Tên Đề Tài</th><th>Mô Tả & Yêu Cầu</th><th>Số Lượng</th><th>Nhận SV</th><th>Thao Tác</th></tr>
                </thead>
                <tbody id="deTaiTableBody">
                    <tr><td colspan="6" class="text-center py-4"><div class="spinner-border text-primary"></div></td></tr>
                </tbody>
            </table>
        </div>
    `;

    try {
        cacheListGVDeTai = await fetchAPI('/de-tai/my-de-tai');
        renderGVDeTaiRows(cacheListGVDeTai);
    } catch (error) {
        document.getElementById('deTaiTableBody').innerHTML = `<tr><td colspan="6" class="text-danger text-center py-3">${error.message}</td></tr>`;
    }
}

function renderGVDeTaiRows(listDeTai) {
    const tableBody = document.getElementById('deTaiTableBody');
    if (!tableBody) return;
    if (!listDeTai || listDeTai.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="6" class="text-center text-muted py-4">Không tìm thấy đề tài nào.</td></tr>`;
        return;
    }
    tableBody.innerHTML = listDeTai.map((dt, index) => {
        const isKhoa = dt.trang_thai === 'da_khoa';
        return `
            <tr>
                <td>${index + 1}</td>
                <td class="fw-bold text-primary" style="max-width: 250px;">${dt.ten_de_tai}</td>
                <td><small class="text-muted d-block text-truncate" style="max-width: 320px;">${dt.mo_ta}</small></td>
                <td><span class="badge bg-secondary px-3 py-2">${dt.so_luong_sv_toi_da} SV</span></td>
                <td>
                    <button class="btn btn-sm ${isKhoa ? 'btn-danger' : 'btn-success'} rounded-pill px-3 fw-bold" onclick="toggleKhoaDeTaiAction('${dt._id}')">
                        <i class="fa-solid ${isKhoa ? 'fa-lock' : 'fa-lock-open'} me-1"></i> ${isKhoa ? 'Đã ngưng nhận' : 'Đang nhận'}
                    </button>
                </td>
                <td>
                    <button class="btn btn-sm btn-outline-primary rounded-pill me-1" onclick="showModalSuaDeTai('${dt._id}', '${escapeHtml(dt.ten_de_tai)}', '${escapeHtml(dt.mo_ta)}', ${dt.so_luong_sv_toi_da}, '${dt.dot_do_an ? (dt.dot_do_an._id || dt.dot_do_an) : ''}')">
                        <i class="fa-solid fa-pen"></i> Sửa
                    </button>
                    <button class="btn btn-sm btn-outline-danger rounded-pill" onclick="deleteDeTaiAction('${dt._id}', '${escapeHtml(dt.ten_de_tai)}')">
                        <i class="fa-solid fa-trash"></i> Xóa
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

function filterGVDeTaiRealtime() {
    const keyword = (document.getElementById('searchGVDeTaiInput')?.value || '').toLowerCase().trim();
    const filtered = cacheListGVDeTai.filter(dt => 
        dt.ten_de_tai.toLowerCase().includes(keyword) || (dt.mo_ta && dt.mo_ta.toLowerCase().includes(keyword))
    );
    renderGVDeTaiRows(filtered);
}

function escapeHtml(str) {
    return (str || '').replace(/'/g, "\\'").replace(/"/g, '&quot;');
}

async function showModalTaoDeTai() {
    const listDot = await fetchAPI('/dot-do-an');
    const selectDot = document.getElementById('deTaiDotSelect');
    selectDot.innerHTML = listDot.map(d => `<option value="${d._id}">${d.ten_dot}</option>`).join('');

    const modal = new bootstrap.Modal(document.getElementById('modalTaoDeTai'));
    modal.show();

    document.getElementById('formTaoDeTai').onsubmit = async function(e) {
        e.preventDefault();
        const bodyData = {
            dot_do_an: document.getElementById('deTaiDotSelect').value,
            ten_de_tai: document.getElementById('deTaiTenInput').value,
            so_luong_sv_toi_da: Number(document.getElementById('deTaiSoLuongInput').value),
            mo_ta: document.getElementById('deTaiMoTaInput').value
        };
        try {
            const res = await fetchAPI('/de-tai', 'POST', bodyData);
            alert(res.message);
            modal.hide();
            loadGVDeTai();
        } catch (error) { alert(error.message); }
    };
}

async function showModalSuaDeTai(id, tenDeTai, moTa, soLuong, dotId) {
    const listDot = await fetchAPI('/dot-do-an');
    const selectDot = document.getElementById('editDeTaiDotSelect');
    selectDot.innerHTML = listDot.map(d => `<option value="${d._id}" ${d._id === dotId ? 'selected' : ''}>${d.ten_dot}</option>`).join('');

    document.getElementById('editDeTaiId').value = id;
    document.getElementById('editDeTaiTenInput').value = tenDeTai;
    document.getElementById('editDeTaiMoTaInput').value = moTa;
    document.getElementById('editDeTaiSoLuongInput').value = soLuong;

    const modal = new bootstrap.Modal(document.getElementById('modalSuaDeTai'));
    modal.show();

    document.getElementById('formSuaDeTai').onsubmit = async function(e) {
        e.preventDefault();
        const editId = document.getElementById('editDeTaiId').value;
        const bodyData = {
            ten_de_tai: document.getElementById('editDeTaiTenInput').value,
            so_luong_sv_toi_da: Number(document.getElementById('editDeTaiSoLuongInput').value),
            mo_ta: document.getElementById('editDeTaiMoTaInput').value
        };
        try {
            const res = await fetchAPI(`/de-tai/${editId}`, 'PUT', bodyData);
            alert(res.message);
            modal.hide();
            loadGVDeTai();
        } catch (error) { alert(error.message); }
    };
}

async function toggleKhoaDeTaiAction(id) {
    try {
        const res = await fetchAPI(`/de-tai/${id}/toggle-khoa`, 'PUT');
        alert(res.message);
        loadGVDeTai();
    } catch (error) { alert(error.message); }
}

async function deleteDeTaiAction(id, ten) {
    if (!confirm(`Bạn có chắc muốn xóa đề tài "${ten}"?`)) return;
    try {
        const res = await fetchAPI(`/de-tai/${id}`, 'DELETE');
        alert(res.message);
        loadGVDeTai();
    } catch (error) { alert(error.message); }
}

// ----------------------------------------------------
// GIẢNG VIÊN: DANH SÁCH SINH VIÊN (GỒM 2 TAB: DUYỆT & HD)
// ----------------------------------------------------
let cacheGVDangKyList = [];
let cacheGVChamDiemList = [];

async function loadGVDanhSachSinhVien(activeTab = 'tabDuyet') {
    const mainContent = document.getElementById('mainContent');
    mainContent.innerHTML = `
        <h4 class="fw-bold text-primary mb-4"><i class="fa-solid fa-users-viewfinder me-2"></i>Danh Sách Sinh Viên</h4>

        <!-- 2 Tabs Điều hướng -->
        <ul class="nav nav-pills mb-4 gap-2 bg-light p-2 rounded-4 border">
            <li class="nav-item">
                <button class="nav-link rounded-pill px-4 fw-bold ${activeTab === 'tabDuyet' ? 'active' : ''}" onclick="switchGVSVTab('tabDuyet')">
                    <i class="fa-solid fa-user-clock me-1"></i> Duyệt Sinh Viên <span id="countChoDuyetBadge" class="badge bg-danger rounded-pill ms-1">0</span>
                </button>
            </li>
            <li class="nav-item">
                <button class="nav-link rounded-pill px-4 fw-bold ${activeTab === 'tabHuongDan' ? 'active' : ''}" onclick="switchGVSVTab('tabHuongDan')">
                    <i class="fa-solid fa-list-check me-1"></i> Danh Sách Sinh Viên Hướng Dẫn & Chấm Điểm
                </button>
            </li>
        </ul>

        <div id="gvTabContentArea">
            <div class="text-center py-5"><div class="spinner-border text-primary"></div></div>
        </div>
    `;

    try {
        // Tải song song cả 2 nguồn dữ liệu
        [cacheGVDangKyList, cacheGVChamDiemList] = await Promise.all([
            fetchAPI('/project-process/gv-dang-ky'),
            fetchAPI('/project-process/gv-cham-diem')
        ]);

        // Cập nhật số lượng chờ duyệt lên Badge
        const choDuyetCount = cacheGVDangKyList.filter(dk => dk.trang_thai === 'cho_duyet').length;
        const countBadge = document.getElementById('countChoDuyetBadge');
        if (countBadge) countBadge.textContent = choDuyetCount;

        renderGVSVTabContent(activeTab);
    } catch (error) {
        document.getElementById('gvTabContentArea').innerHTML = `<div class="alert alert-danger">${error.message}</div>`;
    }
}

function switchGVSVTab(tabName) {
    loadGVDanhSachSinhVien(tabName);
}

// Render nội dung của 2 Tab Sinh viên Giảng viên
function renderGVSVTabContent(activeTab) {
    const area = document.getElementById('gvTabContentArea');
    if (!area) return;

    if (activeTab === 'tabDuyet') {
        const listChoDuyet = cacheGVDangKyList.filter(dk => dk.trang_thai === 'cho_duyet');
        if (listChoDuyet.length === 0) {
            area.innerHTML = `<div class="card p-5 text-center border-0 shadow-sm rounded-4 text-muted"><i class="fa-solid fa-circle-check fs-1 text-success mb-2"></i><p class="m-0 fw-bold">Hiện không có yêu cầu đăng ký nào đang chờ duyệt.</p></div>`;
            return;
        }

        area.innerHTML = `
            <div class="table-responsive">
                <table class="table table-hover align-middle border rounded-3 overflow-hidden">
                    <thead class="table-light">
                        <tr><th>#</th><th>MSSV</th><th>Họ và Tên SV</th><th>Tên Đề Tài Đăng Ký</th><th>Trạng Thái</th><th>Thao Tác</th></tr>
                    </thead>
                    <tbody>
                        ${listChoDuyet.map((dk, index) => {
                            const sv = dk.sinh_vien || {};
                            const dt = dk.de_tai || {};
                            return `
                                <tr>
                                    <td>${index + 1}</td>
                                    <td class="fw-bold text-primary">${sv.ma_so || 'N/A'}</td>
                                    <td class="fw-bold text-dark">${sv.ho_ten || 'N/A'}</td>
                                    <td style="max-width: 250px;">${dt.ten_de_tai || 'N/A'}</td>
                                    <td><span class="badge bg-warning text-dark px-3 py-2">Chờ duyệt</span></td>
                                    <td>
                                        <button class="btn btn-sm btn-success rounded-pill px-3 fw-bold me-1" onclick="duyetSVAction('${dk._id}', 'dang_thuc_hien')">
                                            <i class="fa-solid fa-check"></i> Duyệt
                                        </button>
                                        <button class="btn btn-sm btn-outline-danger rounded-pill px-3 fw-bold" onclick="duyetSVAction('${dk._id}', 'da_huy')">
                                            <i class="fa-solid fa-xmark"></i> Từ chối
                                        </button>
                                    </td>
                                </tr>
                            `;
                        }).join('')}
                    </tbody>
                </table>
            </div>
        `;
    } else {
        // Tab Danh sách sinh viên hướng dẫn & Chấm điểm
        if (!cacheGVChamDiemList || cacheGVChamDiemList.length === 0) {
            area.innerHTML = `<div class="card p-5 text-center border-0 shadow-sm rounded-4 text-muted"><i class="fa-solid fa-user-group fs-1 mb-2"></i><p class="m-0 fw-bold">Chưa có sinh viên nào trong danh sách hướng dẫn.</p></div>`;
            return;
        }

        area.innerHTML = `
            <div class="table-responsive">
                <table class="table table-hover align-middle border rounded-3 overflow-hidden">
                    <thead class="table-light">
                        <tr><th>#</th><th>MSSV</th><th>Họ Tên SV</th><th>File Báo Cáo Mới Nhất</th><th>Điểm HD</th><th>Thao Tác</th></tr>
                    </thead>
                    <tbody>
                        ${cacheGVChamDiemList.map((item, index) => {
                            const sv = item.dangKy?.sinh_vien || {};
                            const lastBc = item.lastBaoCao;
                            const bd = item.bangDiem;
                            const isDaCham = !!bd;

                            return `
                                <tr>
                                    <td>${index + 1}</td>
                                    <td class="fw-bold text-primary">${sv.ma_so || 'N/A'}</td>
                                    <td class="fw-bold text-dark">${sv.ho_ten || 'N/A'}</td>
                                    <td>
                                        ${lastBc ? `
                                            <a href="http://localhost:5000${lastBc.file_url}" target="_blank" class="btn btn-sm btn-outline-primary rounded-pill px-3">
                                                <i class="fa-solid fa-download me-1"></i> Lần ${lastBc.lan_nop} (${new Date(lastBc.submitted_at).toLocaleDateString('vi-VN')})
                                            </a>
                                        ` : '<span class="badge bg-secondary">Chưa nộp file</span>'}
                                    </td>
                                    <td>
                                        ${isDaCham ? `<span class="fw-bold text-success fs-5">${bd.diem_huong_dan}</span>` : '<span class="badge bg-light text-muted border">Chưa chấm</span>'}
                                    </td>
                                    <td>
                                        ${isDaCham ? `
                                            <span class="badge bg-success-subtle text-success px-3 py-2 rounded-pill fw-bold">
                                                <i class="fa-solid fa-circle-check me-1"></i> Đã hoàn thành
                                            </span>
                                        ` : `
                                            <button class="btn btn-sm btn-primary rounded-pill px-3 fw-bold" onclick="openModalChamDiemDetail('${item.dangKy._id}')">
                                                <i class="fa-solid fa-pen-nib me-1"></i> Chấm điểm
                                            </button>
                                        `}
                                    </td>
                                </tr>
                            `;
                        }).join('')}
                    </tbody>
                </table>
            </div>
        `;
    }
}

// Hàm mở Modal Chấm điểm chi tiết (Đã fix lỗi cú pháp nháy đơn)
function openModalChamDiemDetail(dangKyId) {
    const item = cacheGVChamDiemList.find(x => x.dangKy._id === dangKyId);
    if (!item) return;

    const dk = item.dangKy || {};
    const sv = dk.sinh_vien || {};
    const dt = dk.de_tai || {};
    const lastBc = item.lastBaoCao;

    // 1. Điền dữ liệu chi tiết vào Modal
    document.getElementById('chamDiemDangKyId').value = dangKyId;
    document.getElementById('modalChamDiemTenDeTai').textContent = dt.ten_de_tai || 'Chưa cập nhật tên đề tài';
    document.getElementById('modalChamDiemMoTa').textContent = dt.mo_ta || 'Không có mô tả chi tiết.';
    document.getElementById('modalChamDiemSV').textContent = `${sv.ho_ten || 'N/A'} (${sv.ma_so || ''}) - ${sv.email || ''}`;

    const dot = dt.dot_do_an || {};
    document.getElementById('modalChamDiemDot').textContent = dot.ten_dot || 'Đợt Đồ Án';
    document.getElementById('modalChamDiemDeadline').textContent = dot.han_nop_bao_cao ? new Date(dot.han_nop_bao_cao).toLocaleString('vi-VN') : 'Không giới hạn';

    // 2. Hiển thị danh sách file nộp của sinh viên
    const listFileArea = document.getElementById('modalChamDiemListBaoCao');
    if (lastBc) {
        listFileArea.innerHTML = `
            <div class="d-flex justify-content-between align-items-center bg-light p-2 px-3 rounded-3 border">
                <div>
                    <strong class="text-primary"><i class="fa-solid fa-file-lines me-1"></i> Lần nộp ${lastBc.lan_nop}:</strong> ${lastBc.ten_file_goc}
                    <div class="text-muted" style="font-size: 0.75rem;">Thời gian nộp: ${new Date(lastBc.submitted_at).toLocaleString('vi-VN')}</div>
                </div>
                <a href="http://localhost:5000${lastBc.file_url}" target="_blank" class="btn btn-sm btn-primary rounded-pill px-3 fw-bold">
                    <i class="fa-solid fa-download me-1"></i> Tải về xem
                </a>
            </div>
        `;
    } else {
        listFileArea.innerHTML = `<div class="alert alert-warning m-0 py-2 small"><i class="fa-solid fa-triangle-exclamation me-1"></i> Sinh viên chưa nộp tệp báo cáo nào lên hệ thống!</div>`;
    }

    // 3. Reset form nhập điểm
    document.getElementById('diemHuongDanInput').value = '';
    document.getElementById('nhanXetInput').value = '';

    const modal = new bootstrap.Modal(document.getElementById('modalChamDiem'));
    modal.show();

    // 4. Xử lý lưu điểm
    document.getElementById('formChamDiem').onsubmit = async function(e) {
        e.preventDefault();
        const diem = document.getElementById('diemHuongDanInput').value;
        const nhanXet = document.getElementById('nhanXetInput').value;

        if (!confirm(`Xác nhận lưu điểm: ${diem} và khóa kết quả cho sinh viên này?`)) return;

        try {
            const res = await fetchAPI('/project-process/cham-diem', 'POST', {
                dang_ky_id: dangKyId,
                diem_huong_dan: diem,
                nhan_xet_huong_dan: nhanXet
            });
            alert(`🎉 ${res.message}`);
            modal.hide();
            loadGVDanhSachSinhVien('tabHuongDan'); // Reload lại tab hướng dẫn
        } catch (error) {
            alert('Lỗi: ' + error.message);
        }
    };
}

async function duyetSVAction(id, status) {
    if (!confirm(`Bạn có chắc muốn ${status === 'dang_thuc_hien' ? 'DUYỆT' : 'TỪ CHỐI'} sinh viên này?`)) return;
    try {
        const res = await fetchAPI(`/project-process/duyet-dang-ky/${id}`, 'PUT', { trang_thai: status });
        alert(res.message);
        loadGVDanhSachSinhVien('tabDuyet');
    } catch (error) { alert(error.message); }
}

function openModalChamDiem(dangKyId, diem, nhanXet) {
    document.getElementById('chamDiemDangKyId').value = dangKyId;
    document.getElementById('diemHuongDanInput').value = diem || '';
    document.getElementById('nhanXetInput').value = nhanXet || '';

    const modal = new bootstrap.Modal(document.getElementById('modalChamDiem'));
    modal.show();

    document.getElementById('formChamDiem').onsubmit = async function(e) {
        e.preventDefault();
        try {
            const res = await fetchAPI('/project-process/cham-diem', 'POST', {
                dang_ky_id: document.getElementById('chamDiemDangKyId').value,
                diem_huong_dan: document.getElementById('diemHuongDanInput').value,
                nhan_xet_huong_dan: document.getElementById('nhanXetInput').value
            });
            alert(res.message);
            modal.hide();
            loadGVDanhSachSinhVien('tabHuongDan');
        } catch (error) { alert(error.message); }
    };
}

// Duyệt xin gia hạn
async function loadGVDuyetGiaHan() {
    const mainContent = document.getElementById('mainContent');
    mainContent.innerHTML = `
        <h4 class="fw-bold text-primary mb-4"><i class="fa-solid fa-clock-rotate-left me-2"></i>Xét Duyệt Đơn Xin Gia Hạn Báo Cáo</h4>
        <div class="table-responsive">
            <table class="table table-hover align-middle border rounded-3 overflow-hidden">
                <thead class="table-light">
                    <tr><th>#</th><th>Sinh Viên</th><th>Lý Do Xin Gia Hạn</th><th>Hạn Mới Đề Xuất</th><th>Trạng Thái</th><th>Thao Tác</th></tr>
                </thead>
                <tbody id="giaHanTableBody">
                    <tr><td colspan="6" class="text-center py-4"><div class="spinner-border text-primary"></div></td></tr>
                </tbody>
            </table>
        </div>
    `;

    try {
        const list = await fetchAPI('/project-process/gv-gia-han');
        const tbody = document.getElementById('giaHanTableBody');
        if (!list || list.length === 0) {
            tbody.innerHTML = `<tr><td colspan="6" class="text-center text-muted py-4">Không có đơn xin gia hạn nào.</td></tr>`;
            return;
        }
        tbody.innerHTML = list.map((item, index) => {
            const sv = item.dang_ky?.sinh_vien || {};
            let status = '<span class="badge bg-warning text-dark">Chờ duyệt</span>';
            if (item.trang_thai === 'da_duyet') status = '<span class="badge bg-success">Đã duyệt</span>';
            if (item.trang_thai === 'tu_choi') status = '<span class="badge bg-danger">Từ chối</span>';

            return `
                <tr>
                    <td>${index + 1}</td>
                    <td><strong>${sv.ho_ten || 'N/A'}</strong><br><small class="text-muted">${sv.ma_so || ''}</small></td>
                    <td>${item.ly_do}</td>
                    <td><strong class="text-danger">${new Date(item.han_nop_moi_de_xuat).toLocaleDateString('vi-VN')}</strong></td>
                    <td>${status}</td>
                    <td>
                        ${item.trang_thai === 'cho_duyet' ? `
                            <button class="btn btn-sm btn-success rounded-pill px-3 me-1 fw-bold" onclick="duyetGiaHanAction('${item._id}', 'da_duyet')"><i class="fa-solid fa-check"></i> Duyệt</button>
                            <button class="btn btn-sm btn-outline-danger rounded-pill px-3 fw-bold" onclick="duyetGiaHanAction('${item._id}', 'tu_choi')"><i class="fa-solid fa-xmark"></i> Từ chối</button>
                        ` : '<span class="text-muted small">Đã phản hồi</span>'}
                    </td>
                </tr>
            `;
        }).join('');
    } catch (error) {
        document.getElementById('giaHanTableBody').innerHTML = `<tr><td colspan="6" class="text-danger text-center py-3">${error.message}</td></tr>`;
    }
}

async function duyetGiaHanAction(id, status) {
    const feedback = prompt('Nhập phản hồi/ghi chú của bạn cho sinh viên:');
    try {
        const res = await fetchAPI(`/project-process/duyet-gia-han/${id}`, 'PUT', {
            trang_thai: status,
            phan_hoi_giang_vien: feedback || ''
        });
        alert(res.message);
        loadGVDuyetGiaHan();
    } catch (error) { alert(error.message); }
}

// ========================================================
// 3. PHÂN HỆ SINH VIÊN (CARD LAYOUT THEO BÁO CÁO)
// ========================================================
let cacheListSVDeTai = [];

async function loadSVDanhSachDeTai() {
    const mainContent = document.getElementById('mainContent');
    mainContent.innerHTML = `
        <div class="d-flex justify-content-between align-items-center mb-4">
            <h4 class="fw-bold text-primary m-0"><i class="fa-solid fa-list-check me-2"></i>Tra Cứu & Đăng Ký Đề Tài</h4>
        </div>

        <!-- Bộ Lọc Tìm Kiếm Card Realtime -->
        <div class="row g-3 mb-4 bg-light p-3 rounded-4 border">
            <div class="col-md-12">
                <div class="input-group">
                    <span class="input-group-text bg-white"><i class="fa-solid fa-magnifying-glass text-muted"></i></span>
                    <input type="text" id="searchSVDeTaiCardInput" class="form-control" placeholder="Nhập tên đề tài, giảng viên hoặc từ khóa mô tả..." oninput="filterSVDeTaiCards()">
                </div>
            </div>
        </div>

        <div class="row g-4" id="deTaiCardContainer">
            <div class="col-12 text-center py-5"><div class="spinner-border text-primary"></div></div>
        </div>
    `;

    try {
        cacheListSVDeTai = await fetchAPI('/de-tai');
        renderSVDeTaiCards(cacheListSVDeTai);
    } catch (error) {
        document.getElementById('deTaiCardContainer').innerHTML = `<div class="col-12"><div class="alert alert-danger">${error.message}</div></div>`;
    }
}

function renderSVDeTaiCards(listDeTai) {
    const container = document.getElementById('deTaiCardContainer');
    if (!container) return;

    if (!listDeTai || listDeTai.length === 0) {
        container.innerHTML = `
            <div class="col-12">
                <div class="card p-5 text-center border-0 shadow-sm rounded-4 text-muted">
                    <i class="fa-solid fa-box-open fs-1 mb-2"></i>
                    <p class="m-0 fw-bold">Hiện không có đề tài nào phù hợp với tìm kiếm.</p>
                </div>
            </div>
        `;
        return;
    }

    container.innerHTML = listDeTai.map(dt => {
        const gv = dt.giang_vien || {};
        const dot = dt.dot_do_an || {};
        return `
            <div class="col-md-6 col-lg-4">
                <div class="card h-100 border-0 shadow-sm rounded-4 p-4 d-flex flex-column justify-content-between position-relative" style="transition: transform 0.2s;">
                    <div>
                        <div class="d-flex justify-content-between align-items-start mb-2">
                            <span class="badge bg-primary-subtle text-primary rounded-pill px-3 py-1 fw-bold">${dot.ten_dot || 'Đợt Đồ Án'}</span>
                            <span class="badge bg-secondary-subtle text-secondary rounded-pill px-2 py-1"><i class="fa-solid fa-users me-1"></i>${dt.so_luong_sv_toi_da} SV</span>
                        </div>
                        <h5 class="fw-bold text-dark mb-2 mt-2">${dt.ten_de_tai}</h5>
                        <p class="text-muted small mb-3 text-truncate-3" style="display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden;">
                            ${dt.mo_ta || 'Không có mô tả chi tiết.'}
                        </p>
                    </div>

                    <div class="pt-3 border-top mt-2">
                        <div class="d-flex align-items-center justify-content-between mb-3">
                            <div class="d-flex align-items-center gap-2">
                                <div class="avatar-circle" style="width: 32px; height: 32px; font-size: 0.8rem;">${gv.ho_ten ? gv.ho_ten.charAt(0) : 'G'}</div>
                                <div class="small">
                                    <div class="fw-bold text-dark">${gv.ho_ten || 'Giảng viên'}</div>
                                    <div class="text-muted" style="font-size: 0.75rem;">${gv.email || ''}</div>
                                </div>
                            </div>
                        </div>
                        <button class="btn btn-primary w-100 rounded-pill fw-bold shadow-sm" onclick="dangKyDeTaiAction('${dt._id}', '${escapeHtml(dt.ten_de_tai)}')">
                            <i class="fa-solid fa-hand-pointer me-1"></i> Đăng Ký Đề Tài
                        </button>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

function filterSVDeTaiCards() {
    const keyword = (document.getElementById('searchSVDeTaiCardInput')?.value || '').toLowerCase().trim();
    const filtered = cacheListSVDeTai.filter(dt => {
        const matchTitle = dt.ten_de_tai.toLowerCase().includes(keyword);
        const matchDesc = dt.mo_ta && dt.mo_ta.toLowerCase().includes(keyword);
        const matchGV = dt.giang_vien && dt.giang_vien.ho_ten && dt.giang_vien.ho_ten.toLowerCase().includes(keyword);
        return matchTitle || matchDesc || matchGV;
    });
    renderSVDeTaiCards(filtered);
}

async function dangKyDeTaiAction(deTaiId, tenDeTai) {
    if (!confirm(`Bạn có chắc chắn muốn đăng ký đề tài: "${tenDeTai}"?`)) return;
    try {
        const res = await fetchAPI('/project-process/dang-ky', 'POST', { de_tai_id: deTaiId });
        alert(res.message);
        // Chuyển sang tab Đề tài của tôi
        loadSVDeTaiCuaToi();
    } catch (error) {
        alert('Lỗi: ' + error.message);
    }
}

async function loadSVDeTaiCuaToi() {
    const mainContent = document.getElementById('mainContent');
    mainContent.innerHTML = `<div class="text-center py-5"><div class="spinner-border text-primary"></div><p class="mt-2 text-muted">Đang tải thông tin đề tài của bạn...</p></div>`;

    try {
        const status = await fetchAPI('/project-process/my-status');
        if (!status.hasProject) {
            mainContent.innerHTML = `
                <div class="card p-5 text-center border-0 shadow-sm rounded-4">
                    <i class="fa-solid fa-folder-open text-muted display-3 mb-3"></i>
                    <h5 class="fw-bold text-dark">Bạn chưa đăng ký đề tài nào!</h5>
                    <p class="text-muted">Vui lòng sang tab <strong>Tra Cứu & Đăng Ký</strong> để chọn đề tài phù hợp.</p>
                    <div><button class="btn btn-primary rounded-pill px-4 fw-bold" onclick="loadSVDanhSachDeTai()">Xem danh sách đề tài</button></div>
                </div>
            `;
            return;
        }

        const dk = status.dangKy;
        const dt = dk.de_tai || {};
        const gv = dt.giang_vien || {};
        const dot = dt.dot_do_an || {};
        const listBc = status.listBaoCao || [];
        const bd = status.bangDiem;

        let statusText = '<span class="badge bg-warning text-dark px-3 py-2 fs-6">Đang chờ Giảng viên duyệt</span>';
        if (dk.trang_thai === 'dang_thuc_hien') statusText = '<span class="badge bg-success px-3 py-2 fs-6">Đã duyệt - Đang thực hiện</span>';
        if (dk.trang_thai === 'da_hoan_thanh') statusText = '<span class="badge bg-info text-dark px-3 py-2 fs-6">Đã hoàn thành</span>';

        mainContent.innerHTML = `
            <div class="row g-4">
                <div class="col-md-7">
                    <div class="card p-4 border-0 shadow-sm rounded-4 mb-4">
                        <div class="d-flex justify-content-between align-items-center mb-3">
                            <h5 class="fw-bold text-primary m-0"><i class="fa-solid fa-book me-2"></i>${dt.ten_de_tai}</h5>
                            ${statusText}
                        </div>
                        <p class="text-muted">${dt.mo_ta}</p>
                        <hr>
                        <div class="row g-2 small">
                            <div class="col-6"><strong>GV Hướng dẫn:</strong> ${gv.ho_ten} (${gv.email})</div>
                            <div class="col-6"><strong>Đợt đồ án:</strong> ${dot.ten_dot || 'N/A'}</div>
                            <div class="col-12 mt-2"><strong>Hạn chót nộp báo cáo:</strong> <span class="text-danger fw-bold">${new Date(dot.han_nop_bao_cao).toLocaleString('vi-VN')}</span></div>
                        </div>
                    </div>

                    <!-- Khu vực nộp báo cáo -->
                    ${dk.trang_thai === 'dang_thuc_hien' ? `
                        <div class="card p-4 border-0 shadow-sm rounded-4">
                            <div class="d-flex justify-content-between align-items-center mb-3">
                                <h5 class="fw-bold text-dark m-0"><i class="fa-solid fa-upload me-2 text-primary"></i>Nộp Tệp Báo Cáo (.PDF, .DOCX)</h5>
                                <button class="btn btn-outline-warning btn-sm rounded-pill fw-bold" onclick="openModalGiaHan()"><i class="fa-solid fa-clock-rotate-left me-1"></i> Xin gia hạn</button>
                            </div>
                            <form id="formNopFileBaoCao" class="mt-2">
                                <div class="mb-3">
                                    <input type="file" id="fileBaoCaoInput" class="form-control" accept=".pdf,.doc,.docx" required>
                                </div>
                                <button type="submit" class="btn btn-primary rounded-pill px-4 fw-bold"><i class="fa-solid fa-file-arrow-up me-1"></i> Tải lên báo cáo</button>
                            </form>
                        </div>
                    ` : ''}
                </div>

                <div class="col-md-5">
                    <!-- Kết quả điểm -->
                    <div class="card p-4 border-0 shadow-sm rounded-4 mb-4">
                        <h5 class="fw-bold text-dark mb-3"><i class="fa-solid fa-award me-2 text-warning"></i>Kết Quả Đánh Giá</h5>
                        ${bd ? `
                            <div class="p-3 bg-success-subtle rounded-3 text-center mb-3">
                                <div class="text-muted small">ĐIỂM HƯỚNG DẪN</div>
                                <div class="display-4 fw-bold text-success">${bd.diem_huong_dan}</div>
                            </div>
                            <div><strong>Nhận xét của GV:</strong> <p class="text-muted mb-0">${bd.nhan_xet_huong_dan || 'Không có nhận xét'}</p></div>
                        ` : '<div class="alert alert-secondary border-0 mb-0">Chưa có kết quả chấm điểm từ Giảng viên.</div>'}
                    </div>

                    <!-- Lịch sử nộp -->
                    <div class="card p-4 border-0 shadow-sm rounded-4">
                        <h5 class="fw-bold text-dark mb-3"><i class="fa-solid fa-history me-2 text-info"></i>Lịch Sử Nộp Bài</h5>
                        ${listBc.length > 0 ? `
                            <ul class="list-group list-group-flush small">
                                ${listBc.map(b => `
                                    <li class="list-group-item d-flex justify-content-between align-items-center px-0">
                                        <div><strong>Lần ${b.lan_nop}:</strong> ${b.ten_file_goc}<br><small class="text-muted">${new Date(b.submitted_at).toLocaleString('vi-VN')}</small></div>
                                        <a href="http://localhost:5000${b.file_url}" target="_blank" class="btn btn-sm btn-light text-primary"><i class="fa-solid fa-download"></i></a>
                                    </li>
                                `).join('')}
                            </ul>
                        ` : '<div class="text-muted small">Bạn chưa nộp lần nào.</div>'}
                    </div>
                </div>
            </div>
        `;

        if (document.getElementById('formNopFileBaoCao')) {
            document.getElementById('formNopFileBaoCao').onsubmit = async function(e) {
                e.preventDefault();
                const fileInput = document.getElementById('fileBaoCaoInput');
                if (!fileInput.files[0]) return alert('Vui lòng chọn file!');

                const formData = new FormData();
                formData.append('file_bao_cao', fileInput.files[0]);

                try {
                    const res = await fetchAPI('/project-process/nop-bao-cao', 'POST', formData, true);
                    alert(res.message);
                    loadSVDeTaiCuaToi();
                } catch (error) { alert('Lỗi nộp bài: ' + error.message); }
            };
        }
    } catch (error) { mainContent.innerHTML = `<div class="alert alert-danger">${error.message}</div>`; }
}

function openModalGiaHan() {
    const modal = new bootstrap.Modal(document.getElementById('modalXinGiaHan'));
    modal.show();

    document.getElementById('formXinGiaHan').onsubmit = async function(e) {
        e.preventDefault();
        try {
            const res = await fetchAPI('/project-process/xin-gia-han', 'POST', {
                han_nop_moi_de_xuat: document.getElementById('giaHanDateInput').value,
                ly_do: document.getElementById('giaHanLyDoInput').value
            });
            alert(res.message);
            modal.hide();
        } catch (error) { alert(error.message); }
    };
}

// ========================================================
// 4. THÔNG TIN CÁ NHÂN (PROFILE CÓ AVATAR & CHỨC VỤ)
// ========================================================
function loadProfile() {
    const user = JSON.parse(localStorage.getItem('user')) || {};
    let roleText = 'SINH VIÊN';
    let roleBadgeClass = 'bg-primary';
    if (user.vai_tro === 'admin') { roleText = 'QUẢN TRỊ VIÊN HỆ THỐNG'; roleBadgeClass = 'bg-danger'; }
    if (user.vai_tro === 'giang_vien') { roleText = 'CÁN BỘ GIẢNG VIÊN'; roleBadgeClass = 'bg-indigo text-white'; }

    const mainContent = document.getElementById('mainContent');
    mainContent.innerHTML = `
        <div class="d-flex align-items-center justify-content-between mb-4">
            <h4 class="fw-bold text-primary m-0"><i class="fa-solid fa-id-card me-2"></i>Thông Tin Cá Nhân</h4>
            <button class="btn btn-primary rounded-pill px-4 fw-bold shadow-sm" onclick="showModalCapNhatProfile()">
                <i class="fa-solid fa-pen-to-square me-1"></i> Cập nhật thông tin
            </button>
        </div>

        <div class="row g-4">
            <!-- Cột trái: Khung Avatar & Chức vụ -->
            <div class="col-md-4">
                <div class="card p-4 border-0 shadow-sm rounded-4 text-center h-100 bg-white">
                    <div class="avatar-circle mx-auto mb-3" style="width: 100px; height: 100px; font-size: 2.5rem; background: linear-gradient(135deg, #2563eb, #1d4ed8);">
                        ${user.ho_ten ? user.ho_ten.charAt(0).toUpperCase() : 'U'}
                    </div>
                    <h5 class="fw-bold text-dark mb-1">${user.ho_ten || 'Họ và tên'}</h5>
                    <p class="text-muted small mb-3">${user.ma_so || ''}</p>
                    <div>
                        <span class="badge ${roleBadgeClass} px-3 py-2 rounded-pill fw-bold" style="${user.vai_tro === 'giang_vien' ? 'background:#4338ca;' : ''}">${roleText}</span>
                    </div>
                </div>
            </div>

            <!-- Cột phải: Chi tiết hồ sơ -->
            <div class="col-md-8">
                <div class="card p-4 border-0 shadow-sm rounded-4 h-100 bg-white">
                    <h5 class="fw-bold text-dark mb-4"><i class="fa-solid fa-user-gear me-2 text-primary"></i>Chi Tiết Hồ Sơ</h5>
                    <div class="row g-3">
                        <div class="col-md-6">
                            <label class="form-label fw-bold text-muted small">Mã số định danh:</label>
                            <input type="text" class="form-control bg-light fw-bold text-primary" value="${user.ma_so || ''}" readonly>
                        </div>
                        <div class="col-md-6">
                            <label class="form-label fw-bold text-muted small">Họ và tên:</label>
                            <input type="text" class="form-control bg-light fw-bold" value="${user.ho_ten || ''}" readonly>
                        </div>
                        <div class="col-md-6">
                            <label class="form-label fw-bold text-muted small">Địa chỉ Email trường:</label>
                            <input type="text" class="form-control bg-light" value="${user.email || ''}" readonly>
                        </div>
                        <div class="col-md-6">
                            <label class="form-label fw-bold text-muted small">Số điện thoại liên hệ:</label>
                            <input type="text" class="form-control bg-light" value="${user.so_dien_thoai || 'Chưa cập nhật'}" readonly>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function showModalCapNhatProfile() {
    const user = JSON.parse(localStorage.getItem('user')) || {};
    document.getElementById('profileRoleDisplay').value = user.vai_tro;
    document.getElementById('profileMaSoDisplay').value = user.ma_so || '';
    document.getElementById('profileHoTenDisplay').value = user.ho_ten || '';
    document.getElementById('profileEmailDisplay').value = user.email || '';
    document.getElementById('profileNewPasswordInput').value = '';

    const modal = new bootstrap.Modal(document.getElementById('modalProfileCapNhat'));
    modal.show();

    document.getElementById('formProfileCapNhat').onsubmit = async function(e) {
        e.preventDefault();
        const newPass = document.getElementById('profileNewPasswordInput').value.trim();
        if (!newPass) return alert('Vui lòng nhập mật khẩu mới!');
        if (newPass.length < 6) return alert('Mật khẩu tối thiểu 6 ký tự!');

        try {
            const res = await fetchAPI(`/auth/users/${user.id || user._id}`, 'PUT', { mat_khau_moi: newPass });
            alert(res.message);
            modal.hide();
        } catch (error) { alert(error.message); }
    };
}