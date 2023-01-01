/*
#  *****************************************************************************************************************************************************
#  *                                                                                                                                                   *
#  * @License Starts                                                                                                                                   *
#  *                                                                                                                                                   *
#  * Copyright © 2015 - present. MongoExpUser.  All Rights Reserved.                                                                                   *
#  *                                                                                                                                                   *
#  * License: MIT - https://github.com/MongoExpUser/CloudFormation-Stack-with-AWS-SDK-JS-V3/blob/main/LICENSE                                          *
#  *                                                                                                                                                   *
#  * @License Ends                                                                                                                                     *
#  *****************************************************************************************************************************************************
#  *                                                                                                                                                   *
#  *  index.js implements a module for the creating/deploying or deleting an AWS ClouddFormation stack with AWS-SDK for JavaScript/Node.JS V3          *
#  *                                                                                                                                                   *                                                                                                                                              * 
#  *****************************************************************************************************************************************************
*/


class DeployCloudFormationStack
{
    constructor()
    {
        return null;
    }
    
    async currentTime()
    {
        const timeNow = new Date();
        const year = timeNow.getFullYear();
        const hour = timeNow.getHours();
        const minute = timeNow.getMinutes();
        const second = timeNow.getSeconds();
        return `${hour}-${minute}-${second}`;
    }
    
    async uuid4()
    {
        let timeNow = new Date().getTime();
        let uuidValue =  'xxxxxxxx-xxxx-7xxx-kxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(constant)
        {
            let random = (timeNow  + Math.random() *16 ) % 16 | 0;
            timeNow  = Math.floor(timeNow / 16);
            return (constant === 'x' ? random : (random & 0x3| 0x8)).toString(16);
        });
        
        return uuidValue;
    }

    async prettyPrint(value)
    {
        const util = require('util');
        console.log(util.inspect(value, { showHidden: true, colors: true, depth: 4 }));
    }
    
    async sendCommand(client, command, commandName)
    {
        const dcfs = new DeployCloudFormationStack();
        
        try
        {
            const data = await client.send(command);
            dcfs.prettyPrint({ "data" : data } );
        }
        catch(error)
        {
            return console.log(error);
        }
        
        await dcfs.separator();
        console.log(`Successful ${commandName} Command`);
        await dcfs.separator();
        console.log(`Time is:`, new Date(), `.....`);
        await dcfs.separator();
        
    }

    async createDeployStack(options, config)
    {
        // define variables and use some in tags variables defintion
        const fs = require('fs');
        const dcfs = new DeployCloudFormationStack();
        const createResources  = config.createResources;
        const updateResources  = config.updateResources;
        const deleteResources  = config.deleteResources;
        const { CloudFormationClient, CreateStackCommand, DeleteStackCommand, UpdateStackCommand } = require("@aws-sdk/client-cloudformation");
        const cloudFormationClient = new CloudFormationClient(options);

        if( (createResources === true) || (updateResources === true) )
        {
            const addSuffix = true;
            const suffix = (await dcfs.uuid4()).substring(0,3);
            const orgName = config.orgName;
            const projectName = config.projectName;
            const environment  = config.environment;
            const regionName = config.regionName;
            const preOrPostFix = `${orgName}-${environment}`;
            const resoureName = config.resoureName;
            const serviceProvider = config.serviceProvider;
            const creator = config.creator;
            const tags = [
                { Key: "region", Value: regionName }, 
                { Key: "environment", Value: environment },
                { Key: "project", Value: projectName }, 
                { Key: "creator", Value: creator },
                { Key: "service-provider", Value: serviceProvider }
            ];

            
            const stackName = config.stackName;
            const stackTerminationProtection = config.stackTerminationProtection;
            const stackDescription = config.stackDescription;
            const stackTemplateBodyInput = config.stackTemplateBodyFileName;
            console.log(stackTemplateBodyInput);
            const stackTemplateBody =  JSON.parse(JSON.stringify(fs.readFileSync(stackTemplateBodyInput).toString()));

            if(addSuffix === true)
            {
                tags.push( { Key: "Name", Value: `${preOrPostFix}-${resoureName}-${suffix}` } );
                tags.push( { Key: "name", Value: `${preOrPostFix}-${resoureName}-${suffix}` } );
            }
            else if(addSuffix === false)
            {
                tags.push( { Key: "Name", Value: `${preOrPostFix}-${resoureName}` } );
                tags.push( { Key: "name", Value: `${preOrPostFix}-${resoureName}` } );
            }
        
            let params = { EnableTerminationProtection: stackTerminationProtection, StackName: stackName, TemplateBody: stackTemplateBody, Tags: tags };
            let commandName;
            let command;

            if(createResources === true)
            {
               commandName = "CreateStack";
               command = new CreateStackCommand(params);
            }

            else if(updateResources === true)
            {
                commandName = "UpdateStack";
                command = new UpdateStackCommand(params);
            }


            await dcfs.sendCommand(cloudFormationClient, command, commandName);
        }
        else if(deleteResources === true)
        {
            const stackName = config.stackName;
            const params = { StackName: stackName };
            const command = new DeleteStackCommand(params);
            const commandName = "DeleteStack";
            await dcfs.sendCommand(cloudFormationClient, command, commandName);
        }

    }
    
    async separator()
    {
        console.log("-------------------------------------------------------------------");
    }
}


(async function main()
{
    const fs = require("fs");
    const util = require("util");
    const dcfs = new DeployCloudFormationStack(); 
    const inputConfigJsonFilePath = "inputConfigEcoCfn.json";
    let inputConfig = JSON.parse(fs.readFileSync(inputConfigJsonFilePath));
    const credentialJsonFilePath = inputConfig.credentials;
    let credentials =  JSON.parse(fs.readFileSync(credentialJsonFilePath));
    let options = { credentials: { accessKeyId : credentials.accessKeyId, secretAccessKey: credentials.secretAccessKey }, region: credentials.region }; 
    const config = JSON.parse(fs.readFileSync(inputConfigJsonFilePath));
    await dcfs.createDeployStack(options, config);
}());


// module.exports = { DeployCloudFormationStack };