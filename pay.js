const express = require('express');
const axios = require('axios');
require('dotenv').config();

const app = express();
const port = 3000;

// 카카오페이를 사용하기 위한 관리자 키
const MY_ADMIN_KEY = process.env.KAKAO_KEY

// Axios 인스턴스 생성
const $axios = axios.create({
    baseURL: "https://kapi.kakao.com",
    timeout: 3000,
    headers: {
        Authorization: `KakaoAK ${MY_ADMIN_KEY}`,
        "Content-type": "application/x-www-form-urlencoded;charset=utf-8",
    }
});

// 고정값 설정
const CID = "TC0ONETIME";
const PARTNER_ORDER_ID = "test_oid";
const PARTNER_USER_ID = "test_uid";
let tid;

// CORS 설정
app.all('/*', function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "http://localhost:3000");
    res.header("Access-Control-Allow-Headers", "X-Requested-With");
    next();
});

// 카카오페이 결제 요청 처리
app.post('/kakaopay', async(req, res) => {
    try {
        // 카카오페이 결제 준비 요청
        const response = await $axios({
            method: "post",
            url: "/v1/payment/ready",
            params: {
                cid: CID, // 가맹점 코드 -> 팝업스토어 ID
                partner_order_id: PARTNER_ORDER_ID, // 가맹점 주문 ID
                partner_user_id: PARTNER_USER_ID, // 가맹점 사용자 ID
                item_name: "test_item_name", // 상품 명
                quantity: 1,  // 수량
                total_amount: 22000, // 결제 금액
                vat_amount: 0, // 부가세
                tax_free_amount: 0, // 비과세
                approval_url: `http://localhost:3000/success?partner_order_id=${PARTNER_ORDER_ID}&partner_user_id=${PARTNER_USER_ID}&cid=${CID}`, // 결제 성공 시 리디렉션될 URL
                fail_url: "http://localhost:3000/fail", // 결제 실패 시 리디렉션될 URL
                cancel_url: "http://localhost:3000/cancel", // 결제 취소 시 리디렉션될 URL
            }
        });

        // 결제 준비 응답 로그 출력
        console.log(response);

        // tid 저장
        tid = response.data.tid;

        // 카카오페이 결제 URL 응답
        res.send(response.data.next_redirect_mobile_url);
    } catch (error) {
        console.error("카카오페이 결제 요청 실패:", error.message);
        res.status(500).send("카카오페이 결제 요청 실패");
    }
});

// 결제 성공 시 처리
app.get('/success', async(req, res) => {
    try {
        const param = req.query;

        // 카카오페이 결제 승인 요청
        const response = await $axios({
            method: "post",
            url: "/v1/payment/approve",
            params: {
                cid: param.cid, // 가맹점 코드
                tid: tid, // 결제 고유 번호
                partner_order_id: param.partner_order_id, // 가맹점 주문 ID
                partner_user_id: param.partner_user_id, // 가맹점 사용자 ID
                pg_token: param.pg_token, // 결제 승인 요청 토큰
            }
        });

        // 결제 승인 응답 로그 출력
        console.log('kakaopay :: approve done');
        console.log(`kakaopay :: aid : ${response.data.aid}`);

        // 성공 응답
        res.send("CLOSE THE POPUP");
    } catch (error) {
        console.error("카카오페이 결제 승인 실패:", error.message);
        res.status(500).send("카카오페이 결제 승인 실패");
    }
});

// 결제 실패 시 처리
app.get('/fail', (req, res) => {
    console.log('kakaopay :: fail');
    res.send("Payment failed");
});

// 결제 취소 시 처리
app.get('/cancel', (req, res) => {
    console.log('kakaopay :: cancel');
    res.send("Payment canceled");
});

// 서버 시작
app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});
