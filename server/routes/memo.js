import express from 'express'
import mongoose from 'mongoose'
import Memo from '../models/memo'

const router = express.Router()

/* 
    WRITE MEMO: POST /api/memo
    BODY SAMPLE: { contents: "sample "}
    ERROR CODES
        1: NOT LOGGED IN
        2: EMPTY CONTENTS
*/

router.post('/', (req, res) => {
    if(typeof req.session.loginInfo === 'undefined') {
        return res.status(403).json({
            error: 'NOT LOGGED IN',
            code: 1
        })
    }

    if(typeof req.body.contents === '') {
        return res.status(400).json({
            error: 'EMPTY CONTENTS',
            code: 2
        })
    }

    let memo = new Memo({
        writer: req.session.loginInfo.username,
        contents: req.body.contents
    })

    memo.save( err => {
        if(err) throw err
        return res.json({ success: true })
    })
})

/*
    MODIFY MEMO: PUT /api/memo/:id
    BODY SAMPLE: { contents: "sample "}
    ERROR CODES
        1: INVALID ID,
        2: EMPTY CONTENTS
        3: NOT LOGGED IN
        4: NO RESOURCE
        5: PERMISSION FAILURE
*/

router.put('/:id', (req, res) => {
    // CHECK MEMO ID VALIDITY
    if(!mongoose.Types.ObjectId.isValid(req.params.id)) {
        return res.status(400).json({
            error: "INVALID ID",
            code: 1
        });
    }

    // CHECK CONTENTS VALID
    if(typeof req.body.contents !== 'string') {
        return res.status(400).json({
            error: "EMPTY CONTENTS",
            code: 2
        });
    }

    if(req.body.contents === "") {
        return res.status(400).json({
            error: "EMPTY CONTENTS",
            code: 2
        });
    }

    // CHECK LOGIN STATUS
    if(typeof req.session.loginInfo === 'undefined') {
        return res.status(403).json({
            error: "NOT LOGGED IN",
            code: 3
        });
    }

    // FIND MEMO
    Memo.findById(req.params.id, (err, memo) => {
        if(err) throw err;

        // IF MEMO DOES NOT EXIST
        if(!memo) {
            return res.status(404).json({
                error: "NO RESOURCE",
                code: 4
            });
        }

        // IF EXISTS, CHECK WRITER
        if(memo.writer != req.session.loginInfo.username) {
            return res.status(403).json({
                error: "PERMISSION FAILURE",
                code: 5
            });
        }

        memo.contents = req.body.contents
        memo.date.edited = new Date()
        memo.is_edited = true

        memo.save((err, memo) => {
            if(err) throw err
            return res.json({
                success: true,
                memo
            })
        })
    })
})

/*
    DELETE MEMO: DELETE /api/memo/:id
    ERROR CODES
        1: INVALID ID
        2: NOT LOGGED IN
        3: NO RESOURCE
        4: PERMISSION FAILURE
*/

router.delete('/:id', (req, res) => {
    if(!mongoose.Types.ObjectId.isValid(req.params.id)) {
        return res.status(400).json({
            error: 'INVALID ID',
            code: 1
        })
    }

    if(typeof req.session.loginInfo === 'undefined') {
        return res.status(403).json({
            error: 'NOT LOGGED IN',
            code: 2
        })
    }

    Memo.findById(req.params.id, (err, memo) => {
        if(err) throw err

        if(!memo) {
            return res.status(404).json({
                error: 'NO RESOURCE',
                code: 3
            })
        }
        if(memo.writer !== req.session.loginInfo.username) {
            return res.status(403).json({
                error: 'PERMISSION FAILURE',
                code: 4
            })
        }

        Memo.remove({ _id: req.params.id }, err => {
            if(err) throw err
            return res.json({ success: true })
        })
    })
})

/*
    READ MEMO: GET /api/memo
*/

router.get('/', (req, res) => {
    Memo.find()
    .sort({"_id": -1})
    .limit(6)
    .exec((err, memos) => {
        if(err) throw err
        res.json(memos)
    })
})

export default router