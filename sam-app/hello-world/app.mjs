// Import AWS SDK
const AWS = require('aws-sdk');

// Create DynamoDB document client
const docClient = new AWS.DynamoDB.DocumentClient();

// Create S3 client
const s3 = new AWS.S3();

// Set bucket and table names
const BUCKET_NAME = 'forum-universale-bucket';
const TABLE_NAME = 'forum_universale';

exports.lambdaHandler = async (event, context) => {
    // Get post data from event body
    const postData = JSON.parse(event.body);

    // Check if post data is valid
    if (!postData.title || !postData.content || postData.content.length > 1200) {
        return {
            statusCode: 400,
            body: JSON.stringify({
                message: 'Invalid post data',
            }),
        };
    }

    // Create a unique post ID
    const postId = context.awsRequestId;

    // Create a new post item
    const postItem = {
        id: postId,
        title: postData.title,
        content: postData.content,
        date: new Date().toISOString(),
    };

    // If there's an image, upload it to S3
    if (postData.image) {
        const imageKey = `${postId}.jpg`;

        const uploadParams = {
            Bucket: BUCKET_NAME,
            Key: imageKey,
            Body: Buffer.from(postData.image, 'base64'),
        };

        try {
            const uploadResult = await s3.upload(uploadParams).promise();

            // Add image URL to post item
            postItem.image = uploadResult.Location;
        } catch (error) {
            console.error('Error uploading image:', error);

            return {
                statusCode: 500,
                body: JSON.stringify({
                    message: 'Error uploading image',
                }),
            };
        }
    }

    // Put the new post item in the DynamoDB table
    const putParams = {
        TableName: TABLE_NAME,
        Item: postItem,
    };

    try {
        await docClient.put(putParams).promise();
    } catch (error) {
        console.error('Error putting item:', error);

        return {
            statusCode: 500,
            body: JSON.stringify({
                message: 'Error putting item',
            }),
        };
    }

    // Return success response
    return {
        statusCode: 200,
        body: JSON.stringify({
            message: 'Post created successfully',
            postId: postId,
        }),
    };
};
