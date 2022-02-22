// This file contains the serivce that handles fetching of various tweets and other similar content from official API

// CUSTOM LIBS

import { FetcherService } from "../FetcherService";

import {
    Errors,
    Error,
    Response
} from '../../schema/types/HTTP'

import {
    TweetFilter,
    Tweet
} from "../../schema/types/TweetData";

import {
    User
} from "../../schema/types/UserAccountData";

import {
    tweetsUrl,
    tweetDetailsUrl,
    tweetRepliesUrl,
    tweetLikesUrl,
    tweetRetweetUrl
} from '../helper/Requests';

import { filterJSON, findJSONKey } from "../helper/Parser";

export class TweetService extends FetcherService {
    // MEMBER METHODS
    constructor(
        authToken: string,
        csrfToken: string,
        cookie: string
    ) {
        super(authToken, csrfToken, cookie);
    }

    // Method to fetch tweets filtered by the supplied filter
    // TODO: Make this method also fetch the retweets made by the user
    getTweets(
        filter: TweetFilter,
        cursor: string
    ): Promise<Response<{ tweets: Tweet[], next: string }>> {
        return this.fetchData(tweetsUrl(filter, cursor))
            .then(res => {
                var tweets: Tweet[] = [];
                var next: '';

                // Extracting the cursor to next batch
                next = filterJSON(res, { "cursorType": "Bottom" })['value'];

                // Getting the raw list of tweets from response
                res = findJSONKey(res, 'tweets');

                // Checking if empty tweet list returned
                // If empty, returning
                if (Object.keys(res).length == 0) {
                    return new Response<{ tweets: Tweet[], next: string }>(
                        false,
                        new Error(Errors.NoTweetsFound),
                        { tweets: [], next: '' }
                    );
                }
                // If not empty, extracting tweets
                else {
                    // Iterating through the json array of tweets
                    for (var key of Object.keys(res)) {
                        // Adding the tweets to the tweets list
                        tweets.push(new Tweet().deserialize({ rest_id: res[key]['id_str'], legacy: res[key] }));
                    }

                    return new Response<{ tweets: Tweet[], next: string }>(
                        true,
                        new Error(Errors.NoError),
                        { tweets: tweets, next: next }
                    );
                }
            })
            // If other run-time error occured
            .catch(err => {
                return new Response<{ tweets: Tweet[], next: string }>(
                    false,
                    new Error(Errors.FatalError),
                    { tweets: [], next: '' }
                );
            });
    }

    // Method to fetch a tweet using it's id
    getTweetById(tweetId: string): Promise<Response<Tweet>> {
        return this.fetchData(tweetDetailsUrl(tweetId))
            .then(res => {
                // If tweet does not exist
                if (!Object.keys(res['data']).length) {
                    return new Response<Tweet>(
                        false,
                        new Error(Errors.TweetNotFound),
                        {}
                    );
                }
                // If tweet exists
                else {
                    var tweet: Tweet;

                    // Extracting raw list of tweets from response
                    res = findJSONKey(res, 'entries');

                    // Extracting required raw tweet from response
                    res = findJSONKey(res.filter((item: any) => item['entryId'].indexOf(tweetId) != -1)[0], 'result');

                    // Storing the tweet in a tweet object
                    tweet = new Tweet().deserialize(res);

                    return new Response<Tweet>(
                        true,
                        new Error(Errors.NoError),
                        tweet
                    );
                }
            })
            // If other run-time error occured
            .catch(err => {
                return new Response<Tweet>(
                    false,
                    new Error(Errors.FatalError),
                    {}
                );
            });
    }

    // Method to fetch tweet likes using tweet id
    getTweetLikers(
        tweetId: string,
        count: number,
        cursor: string
    ): Promise<Response<{ likers: User[], next: string }>> {
        return this.fetchData(tweetLikesUrl(tweetId, count, cursor))
            .then(res => {
                // If tweet exists
                if (!Object.keys(res['data']['favoriters_timeline']).length) {
                    return new Response<{ likers: User[], next: string }>(
                        false,
                        new Error(Errors.TweetNotFound),
                        { likers: [], next: '' }
                    );
                }
                // If likers found
                else {
                    var likers: User[] = [];
                    var next: string = '';

                    // Extracting raw likes list from response
                    res = findJSONKey(res, 'entries');

                    // Extracting cursor to next batch
                    next = filterJSON(res, { "cursorType": "Bottom" })['value'];

                    // Iterating over the raw list of likers
                    for (var entry of res) {
                        // Checking if entry is of type user
                        if (entry['entryId'].indexOf('user') != -1) {
                            // Adding the user to list of likers
                            likers.push(new User().deserialize(findJSONKey(entry, 'result')));
                        }
                    }

                    return new Response<{ likers: User[], next: string }>(
                        true,
                        new Error(Errors.NoError),
                        { likers: likers, next: next }
                    );
                }
            })
            // If other run-time error occured
            .catch(err => {
                console.log(err);
                return new Response<{ likers: User[], next: string }>(
                    false,
                    new Error(Errors.FatalError),
                    { likers: [], next: '' }
                );
            });
    }

    // Method to fetch tweet retweeters using tweet id
    getTweetRetweeters(
        tweetId: string,
        count: number,
        cursor: string
    ): Promise<Response<{ retweeters: User[], next: string }>> {
        return this.fetchData(tweetRetweetUrl(tweetId, count, cursor))
            .then(res => {
                // If tweet does not exist
                if (!Object.keys(res['data']['retweeters_timeline']).length) {
                    return new Response<{ retweeters: User[], next: string }>(
                        false,
                        new Error(Errors.TweetNotFound),
                        { retweeters: [], next: '' }
                    );
                }
                // If retweeters found
                else {
                    var retweeters: User[] = [];
                    var next: string = '';

                    // Extracting raw retweeters list from response
                    res = findJSONKey(res, 'entries');

                    // Extracting cursor to next batch
                    next = filterJSON(res, { "cursorType": "Bottom" })['value'];

                    // Iterating over the raw list of likes
                    for (var entry of res) {
                        // Checking if entry is of type user
                        if (entry['entryId'].indexOf('user') != -1) {
                            // Adding the user to list of retweeters
                            retweeters.push(new User().deserialize(findJSONKey(entry, 'result')));
                        }
                    }

                    return new Response<{ retweeters: User[], next: string }>(
                        true,
                        new Error(Errors.NoError),
                        { retweeters: retweeters, next: next }
                    );
                }
            })
            // If other run-time error occured
            .catch(err => {
                return new Response<{ retweeters: User[], next: string }>(
                    false,
                    new Error(Errors.FatalError),
                    { retweeters: [], next: '' }
                );
            });
    }

    // Method to fetch tweet replies using tweet id
    getTweetReplies(
        tweetId: string,
        cursor: string
    ): Promise<Response<{ replies: Tweet[], next: string }>> {
        return this.fetchData(tweetRepliesUrl(tweetId, cursor))
            .then(res => {
                // If tweet does not exist
                if (!Object.keys(res['data']).length) {
                    return new Response<{ replies: Tweet[], next: string }>(
                        false,
                        new Error(Errors.TweetNotFound),
                        { replies: [], next: '' }
                    );
                }
                // If tweet exists
                else {
                    var replies: Tweet[] = [];
                    var next: string = '';

                    // Extracting raw tweet data from response
                    res = findJSONKey(res, 'entries');

                    // Extracting cursor to next batch
                    next = filterJSON(res, { "cursorType": "Bottom" })['value'];

                    // Iterating over raw list of replies
                    for (var entry of res) {
                        // Checking if entry is of type reply
                        if (entry['entryId'].indexOf('conversationthread') != -1) {
                            // Adding the reply to list of replies
                            replies.push(new Tweet().deserialize(findJSONKey(entry, 'result')));
                        }
                    }

                    return new Response<{ replies: Tweet[], next: string }>(
                        true,
                        new Error(Errors.NoError),
                        { replies: replies, next: next }
                    );
                }
            })
            // If other run-time error occured
            .catch(err => {
                return new Response<{ replies: Tweet[], next: string }>(
                    false,
                    new Error(Errors.FatalError),
                    { replies: [], next: '' }
                );
            });
    }
}