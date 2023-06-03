const AWS = require('aws-sdk');
const uuid = require('uuid');
const S3 = new AWS.S3();
const dynamodb = new AWS.DynamoDB.DocumentClient();

const BUCKET_NAME = 'news-articles-images';
const TABLE_NAME = 'NewsArticles';

exports.lambdaHandler = async (event, context) => {
    let response;
    const requestBody = JSON.parse(event.body);
    
    // Generate a unique ID for the post
    const id = uuid.v4();

    // Save the post to DynamoDB
    const putParams = {
        TableName: TABLE_NAME,
        Item: {
            id: id,
            title: requestBody.title,
            content: requestBody.content,
            date: new Date().toISOString(),
        }
    };
    await dynamodb.put(putParams).promise();

    // Upload the image to S3
    const imageBuffer = Buffer.from(requestBody.image, 'base64');
    const uploadParams = {
        Bucket: BUCKET_NAME,
        Key: `${id}.jpg`,
        Body: imageBuffer,
        ContentType: 'image/jpeg',
    };
    await S3.upload(uploadParams).promise();

    response = {
        'statusCode': 200,
        'body': JSON.stringify({
            message: 'Post created successfully',
        })
    };
    return response;
};
