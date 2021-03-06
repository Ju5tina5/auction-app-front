import React, {useContext, useState, useEffect, useRef} from 'react';
import MainContext from "../../context/MainContext";
import {useNavigate} from "react-router-dom";
import http from "../../plugins/http";
import {BsCurrencyEuro} from "react-icons/bs";
import Button from "../../UI/Button";
import Countdown from "react-countdown";

const AuctionItemFull = ({item, setAuction}) => {

    const {user, setUser, setAllAuctions, socket, setWonAuction} = useContext(MainContext);

    const [message, setMessage] = useState('');

    const nav = useNavigate();

    const amountRef = useRef();

    const renderer = ({hours, minutes, seconds, completed}) => {
        if (completed) {
            return <h1>Ended</h1>;
        } else {
            if (hours <= 9) {
                hours = '0' + hours;
            }
            if (minutes <= 9) {
                minutes = '0' + minutes;
            }
            if (seconds <= 9) {
                seconds = '0' + seconds;
            }
            return <span>{hours}:{minutes}:{seconds}</span>;
        }
    };


    const handleCountDownStop = () => {
        http.get(`auctionEnded/${item._id}`).then(res => {
            if (res.success) {
                nav('/')
                let auctionWinner;
                if(res.finishedAuction.bids.length > 0){
                    auctionWinner = res.finishedAuction.bids[res.finishedAuction.bids.length - 1].user_name
                }
                if(user && auctionWinner === user.user_name) setWonAuction({isActive: true, auctionTitle: res.finishedAuction.title})
                setAllAuctions(res.auctions);
            }
        });
    }

    useEffect(() => {
        let isMounted = true;
        socket.on('dibAdded', (data) => {
            if(isMounted) setAuction(data.auction)
        })
        return () => { isMounted = false };
    }, []);

    const handleBidSubmit = (e) => {
        e.preventDefault();
        const obj = {
            _id: item._id,
            amount: amountRef.current.value
        }

        http.post(obj, 'bidAction').then(res => {
            if (res.message === 'Not logged in') {
                setUser(null);
                return nav('/login')
            }
            if (res.success) {
                setUser(res.user)
            }

            setMessage(res.message)
            setTimeout(() => {
                setMessage('')
            }, 1000)
        })
    }


    return (
        <div className={'auctionBig d-flex'}>
            <img src={item.picture} alt=""/>
            <div className={'flex-grow2 d-flex flex-column align-center'}>
                <div>{item.title}</div>
                <strong className={'d-flex align-center'}>Current Price: {item.start_Price} <BsCurrencyEuro/>
                </strong>
                <h4>Publisher: {item.owner_name}</h4>
                {!item.isEnded ?
                    <div className={'d-flex flex-column'}>
                        <strong>Time left:</strong>
                        <div className={'d-flex'}>
                            <Countdown date={item.end_time} renderer={renderer} onComplete={handleCountDownStop}/>
                        </div>
                    </div>
                    :
                    <div className={'d-flex flex-column'}>
                        <h2>Ended</h2>
                    </div>
                }
                {!item.isEnded && user && user.user_name !== item.owner_name &&
                <form onSubmit={handleBidSubmit} className={'d-flex flex-column'}>
                    <input type="number" ref={amountRef} placeholder={'Your bid'}/>
                    <Button type={'submit'}>Confirm Bid</Button>
                </form>}
                <h5 style={{color: 'red'}}>{message}</h5>
            </div>
        </div>
    );
};

export default AuctionItemFull;